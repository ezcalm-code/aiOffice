package start

import (
	"aiOffice/internal/logic"
	"aiOffice/internal/svc"
)

func initHandler(svc *svc.ServiceContext) []Handler {
	// new logics
	var (
		userLogic = logic.NewUser(svc)
	)

	// new handlers
	var (
		user = NewUser(svc, userLogic)
	)

	return []Handler{
		user,
	}
}
