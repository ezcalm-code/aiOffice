package toolx

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"aiOffice/internal/svc"
	"aiOffice/pkg/langchain/outputparserx"

	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/schema"
	"github.com/tmc/langchaingo/textsplitter"
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

	// 读取文件内容
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("读取文件失败: %v", err)
	}

	// 简单文本分块
	splitter := textsplitter.NewRecursiveCharacter(
		textsplitter.WithChunkSize(500),
		textsplitter.WithChunkOverlap(50),
	)

	chunks, err := splitter.SplitText(string(content))
	if err != nil {
		return "", fmt.Errorf("文本分块失败: %v", err)
	}

	// 转换为文档
	docs := make([]schema.Document, 0, len(chunks))
	for i, chunk := range chunks {
		docs = append(docs, schema.Document{
			PageContent: chunk,
			Metadata: map[string]any{
				"source":   filePath,
				"chunk_id": i,
			},
		})
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

	return fmt.Sprintf("知识库更新成功！已添加 %d 个文档块", len(docs)), nil
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
