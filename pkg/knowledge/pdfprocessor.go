package knowledge

import (
	"bytes"
	"fmt"
	"os"
	"strings"

	"github.com/gen2brain/go-fitz"
)

// PDFProcessor 提供改进的PDF文本提取功能（使用go-fitz库，基于MuPDF）
type PDFProcessor struct{}

// NewPDFProcessor 创建新的PDF处理器
func NewPDFProcessor() *PDFProcessor {
	return &PDFProcessor{}
}

// ExtractText 从PDF文件中提取文本
func (p *PDFProcessor) ExtractText(filePath string) (string, error) {
	// 验证文件存在
	if _, err := os.Stat(filePath); err != nil {
		return "", fmt.Errorf("文件不存在: %v", err)
	}

	// 打开PDF文档
	doc, err := fitz.New(filePath)
	if err != nil {
		return "", fmt.Errorf("无法打开PDF文件: %v", err)
	}
	defer doc.Close()

	// 提取所有页面的文本
	var buf bytes.Buffer
	totalPages := doc.NumPage()

	for n := 0; n < totalPages; n++ {
		text, err := doc.Text(n)
		if err != nil {
			fmt.Printf("警告: 无法提取第 %d 页: %v\n", n+1, err)
			continue
		}
		buf.WriteString(text)
		buf.WriteString("\n")
	}

	pdfText := buf.String()
	if len(strings.TrimSpace(pdfText)) == 0 {
		return "", fmt.Errorf("PDF文件中没有提取到有效文本内容")
	}

	// 清理文本
	cleanedText := p.cleanText(pdfText)

	fmt.Printf("[PDFProcessor] 提取成功，总页数: %d，%d 字符\n", totalPages, len(cleanedText))
	// 调试预览
	preview := cleanedText
	if len(preview) > 500 {
		preview = preview[:500]
	}
	fmt.Printf("[PDFProcessor] 预览: %s\n", preview)

	return cleanedText, nil
}

// cleanText 清理提取的文本
func (p *PDFProcessor) cleanText(text string) string {
	text = strings.TrimSpace(text)

	lines := strings.Split(text, "\n")
	var cleanedLines []string
	prevEmpty := false

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			if !prevEmpty {
				cleanedLines = append(cleanedLines, "")
				prevEmpty = true
			}
		} else {
			cleanedLines = append(cleanedLines, line)
			prevEmpty = false
		}
	}

	return strings.Join(cleanedLines, "\n")
}
