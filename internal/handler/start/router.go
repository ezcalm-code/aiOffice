package start

import (
	"aiOffice/internal/logic"
	"aiOffice/internal/svc"
)

func initHandler(svc *svc.ServiceContext) []Handler {
	// new logics
	var (
		chatLogic       = logic.NewChat(svc)
		userLogic       = logic.NewUser(svc)
		departmentLogic = logic.NewDepartment(svc)
		todoLogic       = logic.NewTodo(svc)
		approvalLogic   = logic.NewApproval(svc)
	)

	// new handlers
	var (
		chat       = NewChat(svc, chatLogic)
		user       = NewUser(svc, userLogic)
		department = NewDepartment(svc, departmentLogic)
		todo       = NewTodo(svc, todoLogic)
		approval   = NewApproval(svc, approvalLogic)
	)

	return []Handler{
		chat,
		user,
		department,
		todo,
		approval,
	}
}
