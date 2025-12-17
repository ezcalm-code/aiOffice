package chatinternal

import (
	"aiOffice/internal/svc"

	"github.com/tmc/langchaingo/agents"
	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/tools"
)

type basechat struct {
	agentsChain chains.Chain
}

func NewBaseChat(svc *svc.ServiceContext, ts []tools.Tool) *basechat {
	// 创建agent，配置系统提示让它知道必须使用工具
	agent := agents.NewOneShotAgent(svc.LLM, ts,
		agents.WithMaxIterations(3),
	)

	executor := agents.NewExecutor(agent,
		agents.WithMaxIterations(3),
	)

	return &basechat{
		agentsChain: executor,
	}
}
