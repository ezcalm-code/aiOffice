package toolx

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"aiOffice/internal/svc"
	"aiOffice/pkg/knowledge"
	"aiOffice/pkg/langchain/outputparserx"

	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/vectorstores/redisvector"
)

// KnowledgeUpdate 知识库更新工具
type KnowledgeUpdate struct {
	svc          *svc.ServiceContext
	outputparser outputparserx.Structured
	store        *redisvector.Store
}

func NewKnowledgeUpdate(svc *svc.ServiceContext) *KnowledgeUpdate {
	return &KnowledgeUpdate{
		svc: svc,
		outputparser: outputparserx.NewStructured([]outputparserx.ResponseSchema{
			{
				Name:        "path",
				Description: "the path to file",
			},
			{
				Name:        "name",
				Description: "the name to file",
			},
		}),
	}
}

func (k *KnowledgeUpdate) Name() string {
	return "knowledge_update"
}

func (k *KnowledgeUpdate) Description() string {
	return `a knowledge base update interface.
use when you need to update knowledge base content.
use when user says: "更新知识库", "添加文档到知识库", "上传文件到知识库"
支持的文件格式: .md, .pdf, .docx, .txt
` + k.outputparser.GetFormatInstructions()
}

func (k *KnowledgeUpdate) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[KnowledgeUpdate] 被调用，输入: %s\n", input)

	// 解析输入
	var data any
	data, err := k.outputparser.Parse(input)
	if err != nil {
		t := make(map[string]any)
		if err := json.Unmarshal([]byte(input), &t); err != nil {
			return "", fmt.Errorf("解析输入失败: %v", err)
		}
		data = t
	}

	file := data.(map[string]any)
	filePath := fmt.Sprintf("%v", file["path"])

	// 如果是相对路径，转换为绝对路径
	if !filepath.IsAbs(filePath) {
		workDir, _ := os.Getwd()
		filePath = filepath.Join(workDir, filePath)
	}

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", fmt.Errorf("文件不存在: %s", filePath)
	}

	// 检查文件格式是否支持
	if !knowledge.IsSupportedFormat(filePath) {
		return "", fmt.Errorf("不支持的文件格式，支持: %v", knowledge.SupportedFormats())
	}

	// 使用多格式文档处理器
	processor := knowledge.NewDocProcessor(500, 50)
	docs, err := processor.Process(filePath)
	if err != nil {
		return "", fmt.Errorf("文档处理失败: %v", err)
	}

	if len(docs) == 0 {
		return "", fmt.Errorf("文档中没有提取到有效内容")
	}

	// 获取向量存储
	if k.store == nil {
		k.store, err = getKnowledgeStore(ctx, k.svc)
		if err != nil {
			return "", fmt.Errorf("获取向量存储失败: %v", err)
		}
	}

	// 添加文档到向量存储
	_, err = k.store.AddDocuments(ctx, docs)
	if err != nil {
		return "", fmt.Errorf("添加文档失败: %v", err)
	}

	filename := filepath.Base(filePath)
	return fmt.Sprintf("知识库更新成功！\n文件: %s\n已添加 %d 个文档块", filename, len(docs)), nil
}

// getKnowledgeStore 获取知识库的向量存储
func getKnowledgeStore(ctx context.Context, svc *svc.ServiceContext) (*redisvector.Store, error) {
	embedder, err := embeddings.NewEmbedder(svc.LLM)
	if err != nil {
		return nil, err
	}

	return redisvector.New(ctx,
		redisvector.WithEmbedder(embedder),
		redisvector.WithConnectionURL("redis://"+svc.Config.Redis.Addr),
		redisvector.WithIndexName("knowledge", true),
	)
}
