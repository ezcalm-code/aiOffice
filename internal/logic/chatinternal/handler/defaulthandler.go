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
	template := "you are an all-round assistant, please help me answer this question: {{.input}}"
	prompt := prompts.PromptTemplate{
		Template:       template,
		InputVariables: []string{langchain.Input},
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
