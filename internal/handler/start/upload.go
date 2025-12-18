package start

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/vectorstores/redisvector"

	"aiOffice/internal/domain"
	"aiOffice/internal/logic"
	"aiOffice/internal/svc"
	"aiOffice/pkg/httpx"
	"aiOffice/pkg/knowledge"
	"aiOffice/pkg/timeutils"
)

type Upload struct {
	svcCtx *svc.ServiceContext
	chat   logic.Chat
}

func NewUpload(svcCtx *svc.ServiceContext, chat logic.Chat) *Upload {
	return &Upload{
		svcCtx: svcCtx,
		chat:   chat,
	}
}

func (h *Upload) InitRegister(engine *gin.Engine) {
	g := engine.Group("v1/upload", h.svcCtx.Jwt.Handler)
	g.POST("/file", h.File)
	g.POST("/files", h.Multiplefiles)
}

// File 处理单个文件上传请求
func (h *Upload) File(ctx *gin.Context) {
	file, header, err := ctx.Request.FormFile("file")
	if err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}
	defer file.Close()

	var buf = bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	// 生成唯一文件名
	filename := fmt.Sprintf("%d%s", timeutils.Now(), filepath.Ext(header.Filename))

	// 确保上传目录存在
	savePath := h.svcCtx.Config.Upload.SavePath
	if savePath == "" {
		savePath = "./uploads/"
	}
	if err := os.MkdirAll(savePath, 0755); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	// 创建目标文件
	newFile, err := os.Create(savePath + filename)
	if err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}
	defer newFile.Close()

	// 写入文件内容
	if _, err := newFile.Write(buf.Bytes()); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	// 构建响应
	host := h.svcCtx.Config.Upload.Host
	if host == "" {
		host = h.svcCtx.Config.Addr
	}

	resp := domain.FileResp{
		Host:     host,
		File:     fmt.Sprintf("%s%s", savePath, filename),
		Filename: filename,
	}

	// 如果指定了chat参数，将文件信息写入记忆机制
	chat := ctx.Request.FormValue("chat")
	if len(chat) > 0 {
		h.chat.File(ctx.Request.Context(), []*domain.FileResp{&resp})
	}

	// 如果指定了knowledge=1参数，自动入库到知识库
	knowledgeFlag := ctx.Request.FormValue("knowledge")
	if knowledgeFlag == "1" {
		if err := h.addToKnowledge(ctx.Request.Context(), resp.File); err != nil {
			httpx.FailWithErr(ctx, fmt.Errorf("知识库入库失败: %v", err))
			return
		}
		resp.Knowledge = true
	}

	httpx.OkWithData(ctx, resp)
}

// Multiplefiles 处理多文件上传请求
func (h *Upload) Multiplefiles(ctx *gin.Context) {
	form, err := ctx.MultipartForm()
	if err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		httpx.FailWithErr(ctx, fmt.Errorf("请选择要上传的文件"))
		return
	}

	// 确保上传目录存在
	savePath := h.svcCtx.Config.Upload.SavePath
	if savePath == "" {
		savePath = "./uploads/"
	}
	if err := os.MkdirAll(savePath, 0755); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	host := h.svcCtx.Config.Upload.Host
	if host == "" {
		host = h.svcCtx.Config.Addr
	}

	respList := make([]*domain.FileResp, 0, len(files))

	for _, header := range files {
		file, err := header.Open()
		if err != nil {
			httpx.FailWithErr(ctx, err)
			return
		}

		var buf = bytes.NewBuffer(nil)
		if _, err := io.Copy(buf, file); err != nil {
			file.Close()
			httpx.FailWithErr(ctx, err)
			return
		}
		file.Close()

		// 生成唯一文件名（加上索引确保唯一）
		filename := fmt.Sprintf("%d_%d%s", timeutils.Now(), len(respList), filepath.Ext(header.Filename))

		// 创建目标文件
		newFile, err := os.Create(savePath + filename)
		if err != nil {
			httpx.FailWithErr(ctx, err)
			return
		}

		if _, err := newFile.Write(buf.Bytes()); err != nil {
			newFile.Close()
			httpx.FailWithErr(ctx, err)
			return
		}
		newFile.Close()

		respList = append(respList, &domain.FileResp{
			Host:     host,
			File:     fmt.Sprintf("%s%s", savePath, filename),
			Filename: filename,
		})
	}

	// 如果指定了chat参数，将文件信息写入记忆机制
	chat := ctx.Request.FormValue("chat")
	if len(chat) > 0 {
		h.chat.File(ctx.Request.Context(), respList)
	}

	// 如果指定了knowledge=1参数，自动入库到知识库
	knowledgeFlag := ctx.Request.FormValue("knowledge")
	if knowledgeFlag == "1" {
		for _, resp := range respList {
			if err := h.addToKnowledge(ctx.Request.Context(), resp.File); err != nil {
				httpx.FailWithErr(ctx, fmt.Errorf("知识库入库失败(%s): %v", resp.Filename, err))
				return
			}
			resp.Knowledge = true
		}
	}

	httpx.OkWithData(ctx, domain.FileListResp{List: respList})
}

// addToKnowledge 将文件添加到知识库
func (h *Upload) addToKnowledge(ctx context.Context, filePath string) error {
	// 检查文件格式是否支持
	if !knowledge.IsSupportedFormat(filePath) {
		return fmt.Errorf("不支持的文件格式，支持: %v", knowledge.SupportedFormats())
	}

	// 使用多格式文档处理器
	processor := knowledge.NewDocProcessor(500, 50)
	docs, err := processor.Process(filePath)
	if err != nil {
		return fmt.Errorf("文档处理失败: %v", err)
	}

	if len(docs) == 0 {
		return fmt.Errorf("文档中没有提取到有效内容")
	}

	// 获取向量存储
	embedder, err := embeddings.NewEmbedder(h.svcCtx.LLM)
	if err != nil {
		return fmt.Errorf("创建embedder失败: %v", err)
	}

	store, err := redisvector.New(ctx,
		redisvector.WithEmbedder(embedder),
		redisvector.WithConnectionURL("redis://"+h.svcCtx.Config.Redis.Addr),
		redisvector.WithIndexName("knowledge", true),
	)
	if err != nil {
		return fmt.Errorf("连接向量存储失败: %v", err)
	}

	// 使用公共方法分批添加文档
	if err := knowledge.AddToVectorStore(ctx, store, docs); err != nil {
		return err
	}

	fmt.Printf("[Upload] 知识库入库成功: %s, 共 %d 个文档块\n", filepath.Base(filePath), len(docs))
	return nil
}
