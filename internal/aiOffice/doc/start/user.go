package start

import (
	"github.com/gin-gonic/gin"

	"aiOffice/internal/domain"
	"aiOffice/internal/logic"
	"aiOffice/internal/svc"
	"aiOffice/pkg/httpx"
)

type User struct {
	svcCtx *svc.ServiceContext
	user   logic.User
}

func NewUser(svcCtx *svc.ServiceContext, user logic.User) *User {
	return &User{
		svcCtx: svcCtx,
		user:   user,
	}
}

func (h *User) InitRegister(engine *gin.Engine) {
	g0 := engine.Group("v1/user")
	g0.POST("/login", h.Login)

	g1 := engine.Group("v1/user", h.svcCtx.Jwt.Handler)
	g1.GET("/:id", h.Info)
	g1.POST("", h.Create)
	g1.PUT("", h.Edit)
	g1.DELETE("/:id", h.Delete)
	g1.GET("/list", h.List)
	g1.POST("/password", h.UpdatePassword)
}

// Login 用户登录
// @Summary 用户登录
// @Description 验证用户名密码
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param body body domain.LoginReq true "登录请求"
// @Success 200 {object} domain.LoginResp "登录成功"
// @Router /v1/user/login [post]
func (h *User) Login(ctx *gin.Context) {
	var req domain.LoginReq
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	res, err := h.user.Login(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.OkWithData(ctx, res)
	}
}

// Info 获取用户信息
// @Summary 获取用户信息
// @Description 根据ID获取用户
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param id path string true "用户ID"
// @Security Bearer
// @Success 200 {object} domain.User "用户信息"
// @Router /v1/user/{id} [get]
func (h *User) Info(ctx *gin.Context) {
	var req domain.IdPathReq
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	res, err := h.user.Info(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.OkWithData(ctx, res)
	}
}

// Create 创建用户
// @Summary 创建用户
// @Description 新增用户
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param body body domain.User true "用户信息"
// @Security Bearer
// @Success 200 "创建成功"
// @Router /v1/user [post]
func (h *User) Create(ctx *gin.Context) {
	var req domain.User
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	err := h.user.Create(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.Ok(ctx)
	}
}

// Edit 编辑用户
// @Summary 编辑用户
// @Description 更新用户信息
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param body body domain.User true "用户信息"
// @Security Bearer
// @Success 200 "更新成功"
// @Router /v1/user [put]
func (h *User) Edit(ctx *gin.Context) {
	var req domain.User
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	err := h.user.Edit(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.Ok(ctx)
	}
}

// Delete 删除用户
// @Summary 删除用户
// @Description 删除指定用户
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param id path string true "用户ID"
// @Security Bearer
// @Success 200 "删除成功"
// @Router /v1/user/{id} [delete]
func (h *User) Delete(ctx *gin.Context) {
	var req domain.IdPathReq
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	err := h.user.Delete(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.Ok(ctx)
	}
}

// List 用户列表
// @Summary 用户列表
// @Description 分页查询用户
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param ids query []string false "用户ID列表"
// @Param name query string false "用户名模糊搜索"
// @Param page query int false "页码"
// @Param count query int false "每页数量"
// @Security Bearer
// @Success 200 {object} domain.UserListResp "用户列表"
// @Router /v1/user/list [get]
func (h *User) List(ctx *gin.Context) {
	var req domain.UserListReq
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	res, err := h.user.List(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.OkWithData(ctx, res)
	}
}

// UpdatePassword 修改密码
// @Summary 修改密码
// @Description 更新用户密码
// @Tags 用户模块
// @Accept json
// @Produce json
// @Param body body domain.UpdatePasswordReq true "修改密码请求"
// @Security Bearer
// @Success 200 "修改成功"
// @Router /v1/user/password [post]
func (h *User) UpdatePassword(ctx *gin.Context) {
	var req domain.UpdatePasswordReq
	if err := httpx.BindAndValidate(ctx, &req); err != nil {
		httpx.FailWithErr(ctx, err)
		return
	}

	err := h.user.UpdatePassword(ctx.Request.Context(), &req)
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.Ok(ctx)
	}
}
