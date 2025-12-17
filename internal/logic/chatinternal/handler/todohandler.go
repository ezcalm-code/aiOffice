package chatinternal

import (
	"aiOffice/internal/logic/chatinternal/toolx"
	"aiOffice/internal/svc"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/tools"
)

type TodoHandler struct {
	*basechat
}

func NewTodoHandler(svc *svc.ServiceContext) *TodoHandler {
	// 创建待办工具
	todoTools := []tools.Tool{
		toolx.NewTodoTool(svc),      // 创建待办
		toolx.NewTodoQueryTool(svc), // 查询待办
	}

	return &TodoHandler{
		basechat: NewBaseChat(svc, todoTools),
	}
}

func (t *TodoHandler) Name() string {
	return "todo"
}

func (t *TodoHandler) Description() string {
	return "suitable for todo processing, such as todo creation, query, modification, dele tion, etc"
}

func (t *TodoHandler) Chains() chains.Chain {
	return t.basechat.Chains()
}
