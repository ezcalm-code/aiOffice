package chatinternal

import (
	"aiOffice/internal/logic/chatinternal/toolx"
	"aiOffice/internal/svc"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/tools"
)

type KnowledgeHandler struct {
	*basechat
}

func NewKnowledgeHandler(svc *svc.ServiceContext) *KnowledgeHandler {
	knowledgeTools := []tools.Tool{
		toolx.NewKnowledgeUpdate(svc),
		toolx.NewKnowledgeQuery(svc),
	}

	return &KnowledgeHandler{
		basechat: NewBaseChat(svc, knowledgeTools),
	}
}

func (k *KnowledgeHandler) Name() string {
	return "knowledge"
}

func (k *KnowledgeHandler) Description() string {
	return `This is the company's knowledge base.
Can answer employee consultation questions about company systems such as approval process, leave matters, attendance matters, employee manuals and other office content.
Can also be used for updating the knowledge base.`
}

func (k *KnowledgeHandler) Chains() chains.Chain {
	return k.basechat.Chains()
}
