package knowledge

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/nguyenthenguyen/docx"
	"github.com/tmc/langchaingo/schema"
	"github.com/tmc/langchaingo/textsplitter"
	"github.com/tmc/langchaingo/vectorstores"
)

// DocProcessor 多格式文档处理器
type DocProcessor struct {
	ChunkSize    int
	ChunkOverlap int
}

// NewDocProcessor 创建文档处理器
func NewDocProcessor(chunkSize, chunkOverlap int) *DocProcessor {
	if chunkSize <= 0 {
		chunkSize = 500
	}
	if chunkOverlap < 0 {
		chunkOverlap = 50
	}
	return &DocProcessor{
		ChunkSize:    chunkSize,
		ChunkOverlap: chunkOverlap,
	}
}

// Process 处理文档，根据文件类型选择不同的解析和分块策略
func (p *DocProcessor) Process(filePath string) ([]schema.Document, error) {
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("文件不存在: %s", filePath)
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	var text string
	var err error

	switch ext {
	case ".md", ".markdown":
		text, err = p.extractMarkdown(filePath)
		if err != nil {
			return nil, err
		}
		return p.splitMarkdown(text, filePath)

	case ".pdf":
		text, err = p.extractPDF(filePath)
		if err != nil {
			return nil, err
		}
		return p.splitRecursive(text, filePath)

	case ".docx":
		text, err = p.extractWord(filePath)
		if err != nil {
			return nil, err
		}
		return p.splitRecursive(text, filePath)

	case ".txt":
		text, err = p.extractText(filePath)
		if err != nil {
			return nil, err
		}
		return p.splitRecursive(text, filePath)

	default:
		return nil, fmt.Errorf("不支持的文件格式: %s", ext)
	}
}

// extractMarkdown 读取 Markdown 文件
func (p *DocProcessor) extractMarkdown(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("读取Markdown文件失败: %v", err)
	}
	return string(content), nil
}

// extractPDF 从 PDF 提取文本（使用 go-fitz 库，基于 MuPDF）
func (p *DocProcessor) extractPDF(filePath string) (string, error) {
	processor := NewPDFProcessor()
	return processor.ExtractText(filePath)
}

// extractWord 从 Word 文档提取文本
func (p *DocProcessor) extractWord(filePath string) (string, error) {
	r, err := docx.ReadDocxFile(filePath)
	if err != nil {
		return "", fmt.Errorf("打开Word文件失败: %v", err)
	}
	defer r.Close()

	doc := r.Editable()
	text := doc.GetContent()
	text = p.cleanText(text)

	if len(strings.TrimSpace(text)) == 0 {
		return "", fmt.Errorf("Word文件中没有提取到有效文本")
	}

	fmt.Printf("[DocProcessor] Word提取完成，%d 字符\n", len(text))
	return text, nil
}

// extractText 读取纯文本文件
func (p *DocProcessor) extractText(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("读取文本文件失败: %v", err)
	}
	return string(content), nil
}

// splitMarkdown 使用 Markdown 分块器
func (p *DocProcessor) splitMarkdown(text, filePath string) ([]schema.Document, error) {
	splitter := textsplitter.NewMarkdownTextSplitter(
		textsplitter.WithChunkSize(p.ChunkSize),
		textsplitter.WithChunkOverlap(p.ChunkOverlap),
	)

	chunks, err := splitter.SplitText(text)
	if err != nil {
		return nil, fmt.Errorf("Markdown分块失败: %v", err)
	}

	return p.chunksToDocuments(chunks, filePath, "markdown"), nil
}

// splitRecursive 使用递归分块器（适用于 PDF、Word、TXT）
func (p *DocProcessor) splitRecursive(text, filePath string) ([]schema.Document, error) {
	// 中文优化的分隔符
	splitter := textsplitter.NewRecursiveCharacter(
		textsplitter.WithChunkSize(p.ChunkSize),
		textsplitter.WithChunkOverlap(p.ChunkOverlap),
		textsplitter.WithSeparators([]string{
			"\n\n", // 段落
			"\n",   // 换行
			"。",    // 中文句号
			"！",    // 中文感叹号
			"？",    // 中文问号
			"；",    // 中文分号
			".",    // 英文句号
			" ",    // 空格
		}),
	)

	chunks, err := splitter.SplitText(text)
	if err != nil {
		return nil, fmt.Errorf("文本分块失败: %v", err)
	}

	return p.chunksToDocuments(chunks, filePath, "recursive"), nil
}

// chunksToDocuments 将文本块转换为 LangChain 文档格式
func (p *DocProcessor) chunksToDocuments(chunks []string, filePath, splitType string) []schema.Document {
	docs := make([]schema.Document, 0, len(chunks))
	filename := filepath.Base(filePath)

	for i, chunk := range chunks {
		chunk = strings.TrimSpace(chunk)
		if len(chunk) == 0 {
			continue
		}

		docs = append(docs, schema.Document{
			PageContent: chunk,
			Metadata: map[string]any{
				"source":     filePath,
				"filename":   filename,
				"chunk_id":   i,
				"split_type": splitType,
			},
		})
	}

	fmt.Printf("[DocProcessor] 分块完成，共 %d 个文档块\n", len(docs))
	return docs
}

// cleanText 清理文本
func (p *DocProcessor) cleanText(text string) string {
	// 去除首尾空白
	text = strings.TrimSpace(text)

	// 合并多个连续空行为单个空行
	lines := strings.Split(text, "\n")
	var cleaned []string
	prevEmpty := false

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			if !prevEmpty {
				cleaned = append(cleaned, "")
				prevEmpty = true
			}
		} else {
			cleaned = append(cleaned, line)
			prevEmpty = false
		}
	}

	return strings.Join(cleaned, "\n")
}

// SupportedFormats 返回支持的文件格式
func SupportedFormats() []string {
	return []string{".md", ".markdown", ".pdf", ".docx", ".txt"}
}

// IsSupportedFormat 检查文件格式是否支持
func IsSupportedFormat(filePath string) bool {
	ext := strings.ToLower(filepath.Ext(filePath))
	for _, format := range SupportedFormats() {
		if ext == format {
			return true
		}
	}
	return false
}

// VectorStore 向量存储接口
type VectorStore interface {
	AddDocuments(ctx context.Context, docs []schema.Document, options ...vectorstores.Option) ([]string, error)
}

// AddToVectorStore 将文档添加到向量存储（分批处理）
func AddToVectorStore(ctx context.Context, store VectorStore, docs []schema.Document) error {
	// 分批添加文档（阿里云 DashScope 限制每批最多 10 个）
	batchSize := 10
	for i := 0; i < len(docs); i += batchSize {
		end := i + batchSize
		if end > len(docs) {
			end = len(docs)
		}
		batch := docs[i:end]

		_, err := store.AddDocuments(ctx, batch)
		if err != nil {
			return fmt.Errorf("添加文档失败(批次 %d): %v", i/batchSize+1, err)
		}
		fmt.Printf("[Knowledge] 已添加第 %d 批，共 %d 个文档块\n", i/batchSize+1, len(batch))
	}
	return nil
}
