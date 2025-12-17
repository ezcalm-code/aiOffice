package chatinternal

import (
	"context"
	"strings"

	"aiOffice/internal/svc"
	"aiOffice/pkg/langchain"

	"github.com/tmc/langchaingo/agents"
	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/tools"
)

const _defaultMrklPrefix = `Today is {{.today}}.
Answer the following questions as best you can. You have access to the following tools:

{{.tool_descriptions}}

Current conversation:
{{.history}}

`

type basechat struct {
	agentsChain chains.Chain
}

func NewBaseChat(svc *svc.ServiceContext, ts []tools.Tool) *basechat {
	return &basechat{
		agentsChain: agents.NewExecutor(agents.NewOneShotAgent(svc.LLM, ts, agents.WithPromptPrefix(_defaultMrklPrefix))),
	}
}

func (b *basechat) Chains() chains.Chain {
	return chains.NewTransform(b.transform, nil, nil)
}

func (b *basechat) transform(ctx context.Context, inputs map[string]any,
	opts ...chains.ChainCallOption) (map[string]any, error) {

	// 清理非字符串输入
	for s, a := range inputs {
		if _, ok := a.(string); !ok {
			delete(inputs, s)
		}
	}

	outPut, err := b.agentsChain.Call(ctx, inputs, opts...)
	if err != nil {
		return nil, err
	}

	v, ok := outPut["output"]
	if !ok {
		return outPut, nil
	}

	text := v.(string)

	// 处理JSON代码块格式
	withoutJSONStart := strings.Split(text, "```json")
	if !(len(withoutJSONStart) > 1) {
		return map[string]any{
			langchain.Output: v,
		}, err
	}

	withoutJSONEnd := strings.Split(withoutJSONStart[1], "```")
	if len(withoutJSONEnd) < 1 {
		return map[string]any{
			langchain.Output: v,
		}, err
	}

	return map[string]any{
		langchain.Output: withoutJSONEnd[0],
	}, nil
}
