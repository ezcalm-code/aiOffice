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

func NewBaseChat(svc *svc.ServiceContext, tools []tools.Tool) *basechat {
	return &basechat{
		agentsChain: agents.NewExecutor(agents.NewOneShotAgent(svc.LLM, tools)),
	}
}
