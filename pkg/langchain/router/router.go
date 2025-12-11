package router

import (
	"aiOffice/pkg/langchain/handler"
	"context"
	"errors"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/prompts"
	"github.com/tmc/langchaingo/schema"
)

type Router struct {
	handlers map[string]handler.Handler
	chain    chains.Chain
}

func NewRouter(llm llms.Model, handlers []handler.Handler) *Router {

	hs := make(map[string]handler.Handler)
	for _, v := range handlers {
		hs[v.Name()] = v
	}

	prompt := prompts.PromptTemplate{}

	return &Router{
		handlers: hs,
		chain:    chains.NewLLMChain(llm, prompt),
	}
}

func (r *Router) Call(ctx context.Context, inputs map[string]any, opts ...chains.ChainCallOption) (map[string]any, error) {
	// 1. 用LLM分析应该用哪个Handler
	result, err := chains.Call(ctx, r.chain, inputs, opts...)
	if err != nil {
		return nil, err
	}

	// 2. 解析LLM输出，获取目标Handler名称
	handlerName := result["text"].(string)

	// 3. 调用对应的Handler
	handler, ok := r.handlers[handlerName]
	if !ok {
		return nil, errors.New("没有合适的处理器")
	}
	return chains.Call(ctx, handler.Chains(), inputs)
}

// GetMemory 实现chains.Chain接口
func (r *Router) GetMemory() schema.Memory {
	return nil
}

// GetInputKeys 实现chains.Chain接口
func (r *Router) GetInputKeys() []string {
	return []string{"input"}
}

// GetOutputKeys 实现chains.Chain接口
func (r *Router) GetOutputKeys() []string {
	return []string{"text"}
}
