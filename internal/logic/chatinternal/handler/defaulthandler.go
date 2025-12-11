package chatinternal

import (
	"aiOffice/internal/svc"
	"aiOffice/pkg/langchain"
	"fmt"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/prompts"
)

type DefaultHandler struct {
	chain chains.Chain
}

func NewDefaultHandler(svc *svc.ServiceContext) *DefaultHandler {
	template := `你是一个全能助手，请根据对话历史和用户问题进行回答。

对话历史:
{{.history}}

用户问题: {{.input}}

请用中文回答:`
	prompt := prompts.PromptTemplate{
		Template:       template,
		InputVariables: []string{langchain.Input, "history"},
		TemplateFormat: prompts.TemplateFormatGoTemplate,
		PartialVariables: map[string]any{
			"chatType": fmt.Sprintf("%d", langchain.DefaultHandler),
			"data":     "solution",
		},
	}
	return &DefaultHandler{
		chain: chains.NewLLMChain(svc.LLM, prompt),
	}
}

func (d *DefaultHandler) Name() string {
	return "default"
}

func (d *DefaultHandler) Description() string {
	return "suitable for answering multiple questions"
}

func (d *DefaultHandler) Chains() chains.Chain {
	return d.chain
}
