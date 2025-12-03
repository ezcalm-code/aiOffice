package logic

import (
	"context"

	"aiOffice/internal/domain"
	"aiOffice/internal/svc"
)

type User interface {
	// 验证用户名密码
	Login(ctx context.Context, req *domain.LoginReq) (resp *domain.LoginResp, err error)
	// 根据ID获取用户
	Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.User, err error)
	// 新增用户
	Create(ctx context.Context, req *domain.User) (err error)
	// 更新用户信息
	Edit(ctx context.Context, req *domain.User) (err error)
	// 删除指定用户
	Delete(ctx context.Context, req *domain.IdPathReq) (err error)
	// 分页查询用户
	List(ctx context.Context, req *domain.UserListReq) (resp *domain.UserListResp, err error)
	// 更新用户密码
	UpdatePassword(ctx context.Context, req *domain.UpdatePasswordReq) (err error)
}

type user struct {
	svcCtx *svc.ServiceContext
}

func NewUser(svcCtx *svc.ServiceContext) User {
	return &user{
		svcCtx: svcCtx,
	}
}

// 验证用户名密码
func (l *user) Login(ctx context.Context, req *domain.LoginReq) (resp *domain.LoginResp, err error) {
	return
}

// 根据ID获取用户
func (l *user) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.User, err error) {
	return
}

// 新增用户
func (l *user) Create(ctx context.Context, req *domain.User) (err error) {
	return
}

// 更新用户信息
func (l *user) Edit(ctx context.Context, req *domain.User) (err error) {
	return
}

// 删除指定用户
func (l *user) Delete(ctx context.Context, req *domain.IdPathReq) (err error) {
	return
}

// 分页查询用户
func (l *user) List(ctx context.Context, req *domain.UserListReq) (resp *domain.UserListResp, err error) {
	return
}

// 更新用户密码
func (l *user) UpdatePassword(ctx context.Context, req *domain.UpdatePasswordReq) (err error) {
	return
}
