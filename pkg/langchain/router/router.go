package router

import (
	"aiOffice/internal/model"
	"aiOffice/pkg/langchain/handler"
	"context"
	"fmt"
	"strings"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/prompts"
	"github.com/tmc/langchaingo/schema"
)

type Router struct {
	handlers     map[string]handler.Handler
	handlerNames []string
	handlerDescs []string
	chain        chains.Chain
	memory       schema.Memory
	emptyHandle  handler.Handler // 默认处理器，当没有合适处理器时使用
}

func NewRouter(llm llms.Model, handlers []handler.Handler, mem schema.Memory) *Router {

	hs := make(map[string]handler.Handler)
	for _, v := range handlers {
		hs[v.Name()] = v
	}

	// 构建handler名称和描述列表用于路由提示
	var handlerDescs []string
	var handlerNames []string
	for _, h := range handlers {
		handlerNames = append(handlerNames, h.Name())
		handlerDescs = append(handlerDescs, fmt.Sprintf("- %s: %s", h.Name(), h.Description()))
	}

	// 创建路由提示模板
	prompt := prompts.NewPromptTemplate(
		`根据用户输入，选择最合适的处理器。

可选的处理器:
{{.handlers}}

用户输入: {{.input}}

规则：
1. 如果用户要创建待办、任务、提醒等，选择 todo
2. 其他情况选择 default

请只返回处理器名称（todo 或 default），不要返回其他内容。`,
		[]string{"input", "handlers"},
	)

	return &Router{
		handlers:     hs,
		handlerNames: handlerNames,
		handlerDescs: handlerDescs,
		chain:        chains.NewLLMChain(llm, prompt),
		memory:       mem,
	}
}

func (r *Router) Call(ctx context.Context, inputs map[string]any, opts ...chains.ChainCallOption) (map[string]any, error) {
	// 添加handlers参数（使用描述信息）
	inputs["handlers"] = strings.Join(r.handlerDescs, "\n")

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
	handlerName := strings.TrimSpace(result["text"].(string))
	handlerName = strings.ToLower(handlerName)

	fmt.Printf("[Router] LLM选择的handler: %q\n", handlerName)

	// 3. 调用对应的Handler
	h, ok := r.handlers[handlerName]
	if !ok {
		// 如果找不到匹配的handler，使用default handler
		fmt.Printf("[Router] 未找到handler %q，使用default\n", handlerName)
		h, ok = r.handlers["default"]
		if !ok {
			return nil, model.ErrNotHandles
		}
	}
	return chains.Call(ctx, h.Chains(), inputs)
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
