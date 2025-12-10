package chatinternal

import (
	"aiOffice/internal/svc"

	"github.com/tmc/langchaingo/tools"
)

type TodoHandler struct {
	*basechat
}

func NewTodoHandler(svc svc.ServiceContext) *TodoHandler {
	return &TodoHandler{
		basechat: NewBaseChat(&svc, []tools.Tool{}),
	}
}

func (t *TodoHandler) Name() string {
	return "todo"
}

func (t *TodoHandler) Description() string {
	return "suitable for todo processing, such as todo creation, query, modification, dele tion, etc"
}

func (t *TodoHandler) Chains() string {
	return t.Chains()
}
