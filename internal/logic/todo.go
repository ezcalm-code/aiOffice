package logic

import (
	"context"

	"aiOffice/internal/domain"
	"aiOffice/internal/svc"
)

type Todo interface {
	Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.TodoInfoResp, err error)
	Create(ctx context.Context, req *domain.Todo) (resp *domain.IdResp, err error)
	Edit(ctx context.Context, req *domain.Todo) (err error)
	Delete(ctx context.Context, req *domain.IdPathReq) (err error)
	Finish(ctx context.Context, req *domain.FinishedTodoReq) (err error)
	CreateRecord(ctx context.Context, req *domain.TodoRecord) (err error)
	List(ctx context.Context, req *domain.TodoListReq) (resp *domain.TodoListResp, err error)
}

type todo struct {
	svcCtx *svc.ServiceContext
}

func NewTodo(svcCtx *svc.ServiceContext) Todo {
	return &todo{
		svcCtx: svcCtx,
	}
}

func (l *todo) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.TodoInfoResp, err error) {
	return
}

func (l *todo) Create(ctx context.Context, req *domain.Todo) (resp *domain.IdResp, err error) {
	return
}

func (l *todo) Edit(ctx context.Context, req *domain.Todo) (err error) {
	return
}

func (l *todo) Delete(ctx context.Context, req *domain.IdPathReq) (err error) {
	return
}

func (l *todo) Finish(ctx context.Context, req *domain.FinishedTodoReq) (err error) {
	return
}

func (l *todo) CreateRecord(ctx context.Context, req *domain.TodoRecord) (err error) {
	return
}

func (l *todo) List(ctx context.Context, req *domain.TodoListReq) (resp *domain.TodoListResp, err error) {
	return
}
