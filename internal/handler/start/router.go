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
		todoLogic       = logic.NewTodo(svc)
		approvalLogic   = logic.NewApproval(svc)
		chatLogic       = logic.NewChat(svc)
	)

	// new handlers
	var (
		user       = NewUser(svc, userLogic)
		department = NewDepartment(svc, departmentLogic)
		todo       = NewTodo(svc, todoLogic)
		approval   = NewApproval(svc, approvalLogic)
		chat       = NewChat(svc, chatLogic)
		upload     = NewUpload(svc, chatLogic)
	)

	return []Handler{
		user,
		department,
		todo,
		approval,
		chat,
		upload,
	}
}
