package router

import (
	"aiOffice/internal/model"
	"aiOffice/pkg/langchain/handler"
	"context"
	"errors"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/memory"
	"github.com/tmc/langchaingo/prompts"
	"github.com/tmc/langchaingo/schema"
)

type Router struct {
	handlers     map[string]handler.Handler
	handlerNames []string
	chain        chains.Chain
	memory       schema.Memory
	emptyHandle  handler.Handler // 默认处理器，当没有合适处理器时使用
}

func NewRouter(llm llms.Model, handlers []handler.Handler) *Router {

	hs := make(map[string]handler.Handler)
	for _, v := range handlers {
		hs[v.Name()] = v
	}

	// 构建handler名称列表用于路由提示
	var handlerNames []string
	for _, h := range handlers {
		handlerNames = append(handlerNames, h.Name())
	}

	// 创建路由提示模板
	prompt := prompts.NewPromptTemplate(
		`根据用户输入，选择最合适的处理器。可选的处理器有: {{.handlers}}

用户输入: {{.input}}

请只返回处理器名称，不要返回其他内容。`,
		[]string{"input", "handlers"},
	)

	return &Router{
		handlers:     hs,
		handlerNames: handlerNames,
		chain:        chains.NewLLMChain(llm, prompt),
		memory:       memory.NewSimple(),
	}
}

func (r *Router) Call(ctx context.Context, inputs map[string]any, opts ...chains.ChainCallOption) (map[string]any, error) {
	// 添加handlers参数
	inputs["handlers"] = r.handlerNames

	// 如果没有注册任何处理器，使用默认处理器或返回错误
	if len(r.handlers) == 0 {
		if r.emptyHandle != nil {
			return chains.Call(ctx, r.emptyHandle.Chains(), inputs)
		} else {
			return nil, model.ErrNotHandles
		}
	}

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
	return r.memory
}

// GetInputKeys 实现chains.Chain接口
func (r *Router) GetInputKeys() []string {
	return []string{"input"}
}

// GetOutputKeys 实现chains.Chain接口
func (r *Router) GetOutputKeys() []string {
	return []string{"text"}
}
