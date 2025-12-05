package logic

import (
	"context"
	"errors"
	"time"

	"aiOffice/internal/domain"
	"aiOffice/internal/model"
	"aiOffice/internal/svc"
	"aiOffice/pkg/encrypt"
	"aiOffice/pkg/token"
	"aiOffice/pkg/xerr"
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
	// 查找用户
	user, err := l.svcCtx.UserModel.FindByName(ctx, req.Name)
	if err != nil {
		return nil, err
	}
	// 验证密码
	if !encrypt.ValidatePasswordHash(req.Password, (user.Password)) {
		return nil, errors.New("密码错误")
	}
	now := time.Now().Unix()
	token, err := token.GetJwtToken(l.svcCtx.Config.Jwt.Secret, now, l.svcCtx.Config.Jwt.Expire, user.ID.Hex())
	if err != nil {
		return nil, xerr.WithMessagef(err, "GetToken Fail with %s", req.Name)
	}
	return &domain.LoginResp{
		Id:           user.ID.Hex(),
		Name:         user.Name,
		AccessToken:  token,
		AccessExpire: l.svcCtx.Config.Jwt.Expire,
	}, nil
}

// 根据ID获取用户
func (l *user) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.User, err error) {
	user, err := l.svcCtx.UserModel.FindOne(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &domain.User{
		Id:     user.ID.Hex(),
		Name:   user.Name,
		Status: user.Status,
	}, nil
}

// 新增用户
func (l *user) Create(ctx context.Context, req *domain.User) (err error) {
	// 检查用户名是否已存在
	_, err = l.svcCtx.UserModel.FindByName(ctx, req.Name)
	if err == nil {
		return errors.New("用户名已存在")
	}

	// 密码加密
	hashedPassword, err := encrypt.GenPasswordHash([]byte(req.Password))
	if err != nil {
		return xerr.WithMessagef(err, "密码加密失败")
	}

	// 插入用户
	return l.svcCtx.UserModel.Insert(ctx, &model.User{
		Name:     req.Name,
		Password: string(hashedPassword),
		Status:   req.Status,
	})
}

// 更新用户信息
func (l *user) Edit(ctx context.Context, req *domain.User) (err error) {
	// 查找用户
	user, err := l.svcCtx.UserModel.FindOne(ctx, req.Id)
	if err != nil {
		return err
	}

	// 更新字段
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Status != 0 {
		user.Status = req.Status
	}
	if req.Password != "" {
		// 如果提供了新密码，加密后更新
		hashedPassword, err := encrypt.GenPasswordHash([]byte(req.Password))
		if err != nil {
			return xerr.WithMessagef(err, "密码加密失败")
		}
		user.Password = string(hashedPassword)
	}

	return l.svcCtx.UserModel.Update(ctx, user)
}

// 删除指定用户
func (l *user) Delete(ctx context.Context, req *domain.IdPathReq) (err error) {
	return l.svcCtx.UserModel.Delete(ctx, req.Id)
}

// 分页查询用户
func (l *user) List(ctx context.Context, req *domain.UserListReq) (resp *domain.UserListResp, err error) {
	users, total, err := l.svcCtx.UserModel.List(ctx, req.Ids, req.Name, req.Page, req.Count)
	if err != nil {
		return nil, err
	}

	// 转换为 domain 类型
	list := make([]*domain.User, 0, len(users))
	for _, user := range users {
		list = append(list, &domain.User{
			Id:     user.ID.Hex(),
			Name:   user.Name,
			Status: user.Status,
		})
	}

	return &domain.UserListResp{
		Count: total,
		List:  list,
	}, nil
}

// 更新用户密码
func (l *user) UpdatePassword(ctx context.Context, req *domain.UpdatePasswordReq) (err error) {
	// 查找用户
	user, err := l.svcCtx.UserModel.FindOne(ctx, req.Id)
	if err != nil {
		return err
	}

	// 验证旧密码
	if !encrypt.ValidatePasswordHash(req.OldPwd, user.Password) {
		return errors.New("原密码错误")
	}

	// 加密新密码
	hashedPassword, err := encrypt.GenPasswordHash([]byte(req.NewPwd))
	if err != nil {
		return xerr.WithMessagef(err, "密码加密失败")
	}

	// 更新密码
	user.Password = string(hashedPassword)
	return l.svcCtx.UserModel.Update(ctx, user)
}
