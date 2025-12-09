package logic

import (
	"context"

	"aiOffice/internal/domain"
	"aiOffice/internal/model"
	"aiOffice/internal/svc"
	"aiOffice/pkg/xerr"

	"go.mongodb.org/mongo-driver/bson/primitive"
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

// 获取部门SOA信息（树形结构）
func (l *department) Soa(ctx context.Context) (resp *domain.DepartmentSoaResp, err error) {
	// 获取所有部门
	departments, err := l.svcCtx.DepartmentModel.FindAll(ctx)
	if err != nil {
		return nil, xerr.WithMessage(err, "获取部门列表失败")
	}

	// 获取所有部门用户关联
	var depIds []string
	for _, dep := range departments {
		depIds = append(depIds, dep.ID.Hex())
	}

	depUsers, err := l.svcCtx.DepartmentuserModel.FindByDepIds(ctx, depIds)
	if err != nil {
		return nil, xerr.WithMessage(err, "获取部门用户关联失败")
	}

	// 构建部门用户映射
	depUserMap := make(map[string][]*model.Departmentuser)
	for _, du := range depUsers {
		depUserMap[du.DepId] = append(depUserMap[du.DepId], du)
	}

	// 构建部门树
	depMap := make(map[string]*domain.Department)
	var rootDeps []*domain.Department

	for _, dep := range departments {
		domainDep := l.modelToDomain(dep)
		depMap[dep.ID.Hex()] = domainDep

		if dep.ParentId == "" || dep.ParentId == "0" {
			rootDeps = append(rootDeps, domainDep)
		}
	}

	// 构建父子关系
	for _, dep := range departments {
		if dep.ParentId != "" && dep.ParentId != "0" {
			if parent, ok := depMap[dep.ParentId]; ok {
				parent.Child = append(parent.Child, depMap[dep.ID.Hex()])
			}
		}
	}

	// 如果有根部门，返回第一个作为SOA响应
	if len(rootDeps) > 0 {
		firstRoot := rootDeps[0]
		resp = &domain.DepartmentSoaResp{
			Id:       firstRoot.Id,
			Name:     firstRoot.Name,
			ParentId: firstRoot.ParentId,
			Level:    firstRoot.Level,
			LeaderId: firstRoot.LeaderId,
			Leader:   firstRoot.Leader,
			Count:    firstRoot.Count,
			Child:    firstRoot.Child,
		}

		// 添加用户信息
		if users, ok := depUserMap[firstRoot.Id]; ok {
			for _, u := range users {
				resp.Users = append(resp.Users, &domain.DepartmentUser{
					Id:     u.ID.Hex(),
					UserId: u.UserId,
					DepId:  u.DepId,
				})
			}
		}
	}

	return resp, nil
}

// 根据ID获取部门详情
func (l *department) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.Department, err error) {
	dep, err := l.svcCtx.DepartmentModel.FindOne(ctx, req.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, model.ErrNotFindDepartment
		}
		return nil, xerr.WithMessage(err, "查询部门失败")
	}

	resp = l.modelToDomain(dep)

	// 获取子部门
	children, err := l.svcCtx.DepartmentModel.FindByParentId(ctx, dep.ID.Hex())
	if err != nil {
		return nil, xerr.WithMessage(err, "查询子部门失败")
	}

	for _, child := range children {
		resp.Child = append(resp.Child, l.modelToDomain(child))
	}

	return resp, nil
}

// 创建新部门
func (l *department) Create(ctx context.Context, req *domain.Department) (err error) {
	dep := &model.Department{
		Name:       req.Name,
		ParentId:   req.ParentId,
		ParentPath: req.ParentPath,
		Level:      req.Level,
		LeaderId:   req.LeaderId,
		Leader:     req.Leader,
		Count:      0,
	}

	// 如果有父部门，验证父部门是否存在
	if req.ParentId != "" && req.ParentId != "0" {
		_, err := l.svcCtx.DepartmentModel.FindOne(ctx, req.ParentId)
		if err != nil {
			if err == model.ErrNotFound {
				return model.ErrNotFindDepartment
			}
			return xerr.WithMessage(err, "查询父部门失败")
		}
	}

	err = l.svcCtx.DepartmentModel.Insert(ctx, dep)
	if err != nil {
		return xerr.WithMessage(err, "创建部门失败")
	}

	return nil
}

// 更新部门信息
func (l *department) Edit(ctx context.Context, req *domain.Department) (err error) {
	// 查询部门是否存在
	dep, err := l.svcCtx.DepartmentModel.FindOne(ctx, req.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrNotFindDepartment
		}
		return xerr.WithMessage(err, "查询部门失败")
	}

	// 更新字段
	if req.Name != "" {
		dep.Name = req.Name
	}
	if req.ParentId != "" {
		dep.ParentId = req.ParentId
	}
	if req.ParentPath != "" {
		dep.ParentPath = req.ParentPath
	}
	if req.Level > 0 {
		dep.Level = req.Level
	}
	if req.LeaderId != "" {
		dep.LeaderId = req.LeaderId
	}
	if req.Leader != "" {
		dep.Leader = req.Leader
	}

	err = l.svcCtx.DepartmentModel.Update(ctx, dep)
	if err != nil {
		return xerr.WithMessage(err, "更新部门失败")
	}

	return nil
}

// 根据ID删除部门
func (l *department) Delete(ctx context.Context, req *domain.IdPathReq) (err error) {
	// 检查是否有子部门
	children, err := l.svcCtx.DepartmentModel.FindByParentId(ctx, req.Id)
	if err != nil {
		return xerr.WithMessage(err, "查询子部门失败")
	}
	if len(children) > 0 {
		return xerr.New(model.ErrNotFindDepartment)
	}

	// 删除部门用户关联
	err = l.svcCtx.DepartmentuserModel.DeleteByDepId(ctx, req.Id)
	if err != nil {
		return xerr.WithMessage(err, "删除部门用户关联失败")
	}

	// 删除部门
	err = l.svcCtx.DepartmentModel.Delete(ctx, req.Id)
	if err != nil {
		return xerr.WithMessage(err, "删除部门失败")
	}

	return nil
}

// 设置部门用户关联（覆盖式设置）
func (l *department) SetDepartmentUsers(ctx context.Context, req *domain.SetDepartmentUser) (err error) {
	// 验证部门是否存在
	dep, err := l.svcCtx.DepartmentModel.FindOne(ctx, req.DepId)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrNotFindDepartment
		}
		return xerr.WithMessage(err, "查询部门失败")
	}

	// 删除原有关联
	err = l.svcCtx.DepartmentuserModel.DeleteByDepId(ctx, req.DepId)
	if err != nil {
		return xerr.WithMessage(err, "删除原有部门用户关联失败")
	}

	// 添加新关联
	for _, userId := range req.UserIds {
		// 验证用户是否存在
		_, err := l.svcCtx.UserModel.FindOne(ctx, userId)
		if err != nil {
			continue // 跳过不存在的用户
		}

		depUser := &model.Departmentuser{
			DepId:  req.DepId,
			UserId: userId,
		}
		err = l.svcCtx.DepartmentuserModel.Insert(ctx, depUser)
		if err != nil {
			return xerr.WithMessage(err, "添加部门用户关联失败")
		}
	}

	// 更新部门人数
	dep.Count = int64(len(req.UserIds))
	err = l.svcCtx.DepartmentModel.Update(ctx, dep)
	if err != nil {
		return xerr.WithMessage(err, "更新部门人数失败")
	}

	return nil
}

// 添加部门员工（不能添加负责人）
func (l *department) AddDepartmentUser(ctx context.Context, req *domain.AddDepartmentUser) (err error) {
	// 验证部门是否存在
	dep, err := l.svcCtx.DepartmentModel.FindOne(ctx, req.DepId)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrNotFindDepartment
		}
		return xerr.WithMessage(err, "查询部门失败")
	}

	// 不能添加负责人
	if dep.LeaderId == req.UserId {
		return xerr.New(model.ErrNotFindUser)
	}

	// 验证用户是否存在
	_, err = l.svcCtx.UserModel.FindOne(ctx, req.UserId)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrNotFindUser
		}
		return xerr.WithMessage(err, "查询用户失败")
	}

	// 检查是否已存在关联
	existingUsers, err := l.svcCtx.DepartmentuserModel.FindByDepId(ctx, req.DepId)
	if err != nil {
		return xerr.WithMessage(err, "查询部门用户关联失败")
	}

	for _, u := range existingUsers {
		if u.UserId == req.UserId {
			return nil // 已存在，直接返回
		}
	}

	// 添加关联
	depUser := &model.Departmentuser{
		DepId:  req.DepId,
		UserId: req.UserId,
	}
	err = l.svcCtx.DepartmentuserModel.Insert(ctx, depUser)
	if err != nil {
		return xerr.WithMessage(err, "添加部门用户关联失败")
	}

	// 更新部门人数
	dep.Count++
	err = l.svcCtx.DepartmentModel.Update(ctx, dep)
	if err != nil {
		return xerr.WithMessage(err, "更新部门人数失败")
	}

	return nil
}

// 删除部门员工（不能删除负责人）
func (l *department) RemoveDepartmentUser(ctx context.Context, req *domain.RemoveDepartmentUser) (err error) {
	// 验证部门是否存在
	dep, err := l.svcCtx.DepartmentModel.FindOne(ctx, req.DepId)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrNotFindDepartment
		}
		return xerr.WithMessage(err, "查询部门失败")
	}

	// 不能删除负责人
	if dep.LeaderId == req.UserId {
		return xerr.New(model.ErrNotFindUser)
	}

	// 删除关联
	err = l.svcCtx.DepartmentuserModel.DeleteByDepIdAndUserId(ctx, req.DepId, req.UserId)
	if err != nil {
		return xerr.WithMessage(err, "删除部门用户关联失败")
	}

	// 更新部门人数
	if dep.Count > 0 {
		dep.Count--
	}
	err = l.svcCtx.DepartmentModel.Update(ctx, dep)
	if err != nil {
		return xerr.WithMessage(err, "更新部门人数失败")
	}

	return nil
}

// 根据用户ID获取部门信息
func (l *department) DepartmentUserInfo(ctx context.Context, req *domain.IdPathReq) (resp *domain.Department, err error) {
	// 查询用户所属部门关联
	depUsers, err := l.svcCtx.DepartmentuserModel.FindByUserId(ctx, req.Id)
	if err != nil {
		return nil, xerr.WithMessage(err, "查询用户部门关联失败")
	}

	if len(depUsers) == 0 {
		return nil, model.ErrNotFindDepartment
	}

	// 获取第一个部门信息
	dep, err := l.svcCtx.DepartmentModel.FindOne(ctx, depUsers[0].DepId)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, model.ErrNotFindDepartment
		}
		return nil, xerr.WithMessage(err, "查询部门失败")
	}

	resp = l.modelToDomain(dep)
	return resp, nil
}

// 辅助方法：将model转换为domain
func (l *department) modelToDomain(dep *model.Department) *domain.Department {
	return &domain.Department{
		Id:         dep.ID.Hex(),
		Name:       dep.Name,
		ParentId:   dep.ParentId,
		ParentPath: dep.ParentPath,
		Level:      dep.Level,
		LeaderId:   dep.LeaderId,
		Leader:     dep.Leader,
		Count:      dep.Count,
		Child:      []*domain.Department{},
	}
}

// 辅助方法：将domain转换为model
func (l *department) domainToModel(dep *domain.Department) (*model.Department, error) {
	var id primitive.ObjectID
	var err error

	if dep.Id != "" {
		id, err = primitive.ObjectIDFromHex(dep.Id)
		if err != nil {
			return nil, model.ErrInvalidObjectId
		}
	}

	return &model.Department{
		ID:         id,
		Name:       dep.Name,
		ParentId:   dep.ParentId,
		ParentPath: dep.ParentPath,
		Level:      dep.Level,
		LeaderId:   dep.LeaderId,
		Leader:     dep.Leader,
		Count:      dep.Count,
	}, nil
}
