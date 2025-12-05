package logic

import (
	"context"

	"aiOffice/internal/domain"
	"aiOffice/internal/svc"
)

type Department interface {
	Soa(ctx context.Context) (resp *domain.DepartmentSoaResp, err error)
	Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.Department, err error)
	Create(ctx context.Context, req *domain.Department) (err error)
	Edit(ctx context.Context, req *domain.Department) (err error)
	Delete(ctx context.Context, req *domain.IdPathReq) (err error)
	SetDepartmentUsers(ctx context.Context, req *domain.SetDepartmentUser) (err error)
	AddDepartmentUser(ctx context.Context, req *domain.AddDepartmentUser) (err error)
	RemoveDepartmentUser(ctx context.Context, req *domain.RemoveDepartmentUser) (err error)
	DepartmentUserInfo(ctx context.Context, req *domain.IdPathReq) (resp *domain.Department, err error)
}

type department struct {
	svcCtx *svc.ServiceContext
}

func NewDepartment(svcCtx *svc.ServiceContext) Department {
	return &department{
		svcCtx: svcCtx,
	}
}

func (l *department) Soa(ctx context.Context) (resp *domain.DepartmentSoaResp, err error) {
	return
}

func (l *department) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.Department, err error) {
	return
}

func (l *department) Create(ctx context.Context, req *domain.Department) (err error) {
	return
}

func (l *department) Edit(ctx context.Context, req *domain.Department) (err error) {
	return
}

func (l *department) Delete(ctx context.Context, req *domain.IdPathReq) (err error) {
	return
}

func (l *department) SetDepartmentUsers(ctx context.Context, req *domain.SetDepartmentUser) (err error) {
	return
}

func (l *department) AddDepartmentUser(ctx context.Context, req *domain.AddDepartmentUser) (err error) {
	return
}

func (l *department) RemoveDepartmentUser(ctx context.Context, req *domain.RemoveDepartmentUser) (err error) {
	return
}

func (l *department) DepartmentUserInfo(ctx context.Context, req *domain.IdPathReq) (resp *domain.Department, err error) {
	return
}
