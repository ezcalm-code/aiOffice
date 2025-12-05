package start

import (
	"aiOffice/internal/logic"
	"aiOffice/internal/svc"
)

func initHandler(svc *svc.ServiceContext) []Handler {
	// new logics
	var (
		userLogic       = logic.NewUser(svc)
		departmentLogic = logic.NewDepartment(svc)
	)

	// new handlers
	var (
		user       = NewUser(svc, userLogic)
		department = NewDepartment(svc, departmentLogic)
	)

	return []Handler{
		user,
		department,
	}
}
