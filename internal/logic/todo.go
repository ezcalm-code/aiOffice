package logic

import (
	"context"
	"time"

	"aiOffice/internal/domain"
	"aiOffice/internal/model"
	"aiOffice/internal/svc"
	"aiOffice/pkg/xerr"
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

// Info 获取待办详情
func (l *todo) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.TodoInfoResp, err error) {
	todoData, err := l.svcCtx.TodoModel.FindOne(ctx, req.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, model.ErrTodoNotFound
		}
		return nil, xerr.WithMessage(err, "查询待办失败")
	}

	// 获取执行人信息
	userTodos, err := l.svcCtx.UserTodoModel.FindByTodoId(ctx, req.Id)
	if err != nil {
		return nil, xerr.WithMessage(err, "查询执行人失败")
	}

	resp = &domain.TodoInfoResp{
		ID:          todoData.ID.Hex(),
		CreatorId:   todoData.CreatorId,
		CreatorName: todoData.CreatorName,
		Title:       todoData.Title,
		DeadlineAt:  todoData.DeadlineAt,
		Desc:        todoData.Desc,
		Status:      todoData.Status,
		TodoStatus:  todoData.TodoStatus,
	}

	// 转换记录（Records嵌入在Todo中）
	for _, r := range todoData.Records {
		resp.Records = append(resp.Records, &domain.TodoRecord{
			TodoId:   r.TodoId,
			UserId:   r.UserId,
			UserName: r.UserName,
			Content:  r.Content,
			Image:    r.Image,
			CreateAt: r.CreateAt,
		})
	}

	// 转换执行人
	for _, ut := range userTodos {
		resp.ExecuteIds = append(resp.ExecuteIds, &domain.UserTodo{
			ID:         ut.ID.Hex(),
			UserId:     ut.UserId,
			UserName:   ut.UserName,
			TodoId:     ut.TodoId,
			TodoStatus: ut.TodoStatus,
		})
	}

	return resp, nil
}

// Create 创建待办
func (l *todo) Create(ctx context.Context, req *domain.Todo) (resp *domain.IdResp, err error) {
	todoData := &model.Todo{
		CreatorId:   req.CreatorId,
		CreatorName: req.CreatorName,
		Title:       req.Title,
		DeadlineAt:  req.DeadlineAt,
		Desc:        req.Desc,
		Status:      req.Status,
		ExecuteIds:  req.ExecuteIds,
		TodoStatus:  0, // 初始状态：未完成
	}

	// 转换并保存Records
	if len(req.Records) > 0 {
		for _, r := range req.Records {
			todoData.Records = append(todoData.Records, &model.TodoRecord{
				TodoId:   r.TodoId,
				UserId:   r.UserId,
				UserName: r.UserName,
				Content:  r.Content,
				Image:    r.Image,
				CreateAt: time.Now().Unix(),
			})
		}
	}

	err = l.svcCtx.TodoModel.Insert(ctx, todoData)
	if err != nil {
		return nil, xerr.WithMessage(err, "创建待办失败")
	}

	todoId := todoData.ID.Hex()

	// 创建执行人关联
	for _, userId := range req.ExecuteIds {
		user, err := l.svcCtx.UserModel.FindOne(ctx, userId)
		if err != nil {
			continue
		}

		userTodo := &model.UserTodo{
			UserId:     userId,
			UserName:   user.Name,
			TodoId:     todoId,
			TodoStatus: 0,
		}
		_ = l.svcCtx.UserTodoModel.Insert(ctx, userTodo)
	}

	return &domain.IdResp{Id: todoId}, nil
}

// Edit 编辑待办
func (l *todo) Edit(ctx context.Context, req *domain.Todo) (err error) {
	todoData, err := l.svcCtx.TodoModel.FindOne(ctx, req.ID)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrTodoNotFound
		}
		return xerr.WithMessage(err, "查询待办失败")
	}

	// 更新字段
	if req.Title != "" {
		todoData.Title = req.Title
	}
	if req.DeadlineAt > 0 {
		todoData.DeadlineAt = req.DeadlineAt
	}
	if req.Desc != "" {
		todoData.Desc = req.Desc
	}
	if req.Status > 0 {
		todoData.Status = req.Status
	}

	// 更新执行人
	if len(req.ExecuteIds) > 0 {
		todoData.ExecuteIds = req.ExecuteIds

		// 删除原有执行人关联
		_ = l.svcCtx.UserTodoModel.DeleteByTodoId(ctx, req.ID)

		// 创建新的执行人关联
		for _, userId := range req.ExecuteIds {
			user, err := l.svcCtx.UserModel.FindOne(ctx, userId)
			if err != nil {
				continue
			}

			userTodo := &model.UserTodo{
				UserId:     userId,
				UserName:   user.Name,
				TodoId:     req.ID,
				TodoStatus: 0,
			}
			_ = l.svcCtx.UserTodoModel.Insert(ctx, userTodo)
		}
	}

	err = l.svcCtx.TodoModel.Update(ctx, todoData)
	if err != nil {
		return xerr.WithMessage(err, "更新待办失败")
	}

	return nil
}

// Delete 删除待办
func (l *todo) Delete(ctx context.Context, req *domain.IdPathReq) (err error) {
	// 删除待办
	err = l.svcCtx.TodoModel.Delete(ctx, req.Id)
	if err != nil {
		return xerr.WithMessage(err, "删除待办失败")
	}

	// 删除操作记录
	_ = l.svcCtx.TodoRecordModel.DeleteByTodoId(ctx, req.Id)

	// 删除执行人关联
	_ = l.svcCtx.UserTodoModel.DeleteByTodoId(ctx, req.Id)

	return nil
}

// Finish 完成待办
func (l *todo) Finish(ctx context.Context, req *domain.FinishedTodoReq) (err error) {
	// 查询用户待办关联
	userTodo, err := l.svcCtx.UserTodoModel.FindByUserIdAndTodoId(ctx, req.UserId, req.TodoId)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrTodoNotFound
		}
		return xerr.WithMessage(err, "查询用户待办关联失败")
	}

	// 更新用户待办状态为已完成
	userTodo.TodoStatus = 1
	err = l.svcCtx.UserTodoModel.Update(ctx, userTodo)
	if err != nil {
		return xerr.WithMessage(err, "更新用户待办状态失败")
	}

	// 检查是否所有执行人都已完成
	allUserTodos, err := l.svcCtx.UserTodoModel.FindByTodoId(ctx, req.TodoId)
	if err != nil {
		return xerr.WithMessage(err, "查询待办执行人失败")
	}

	allFinished := true
	for _, ut := range allUserTodos {
		if ut.TodoStatus != 1 {
			allFinished = false
			break
		}
	}

	// 如果所有人都完成，更新待办状态
	if allFinished {
		todoData, err := l.svcCtx.TodoModel.FindOne(ctx, req.TodoId)
		if err != nil {
			return xerr.WithMessage(err, "查询待办失败")
		}
		todoData.TodoStatus = 1
		err = l.svcCtx.TodoModel.Update(ctx, todoData)
		if err != nil {
			return xerr.WithMessage(err, "更新待办状态失败")
		}
	}

	return nil
}

// CreateRecord 创建操作记录（追加到Todo.Records数组中）
func (l *todo) CreateRecord(ctx context.Context, req *domain.TodoRecord) (err error) {
	// 查询待办
	todoData, err := l.svcCtx.TodoModel.FindOne(ctx, req.TodoId)
	if err != nil {
		if err == model.ErrNotFound {
			return model.ErrTodoNotFound
		}
		return xerr.WithMessage(err, "查询待办失败")
	}

	// 创建新记录
	record := &model.TodoRecord{
		TodoId:   req.TodoId,
		UserId:   req.UserId,
		UserName: req.UserName,
		Content:  req.Content,
		Image:    req.Image,
		CreateAt: time.Now().Unix(),
	}

	// 追加到Records数组
	todoData.Records = append(todoData.Records, record)

	// 更新待办
	err = l.svcCtx.TodoModel.Update(ctx, todoData)
	if err != nil {
		return xerr.WithMessage(err, "创建操作记录失败")
	}

	return nil
}

// List 待办列表
func (l *todo) List(ctx context.Context, req *domain.TodoListReq) (resp *domain.TodoListResp, err error) {
	var todos []*model.Todo
	var total int64

	// 如果指定了用户ID，先查询用户关联的待办
	if req.UserId != "" {
		userTodos, err := l.svcCtx.UserTodoModel.FindByUserId(ctx, req.UserId)
		if err != nil {
			return nil, xerr.WithMessage(err, "查询用户待办关联失败")
		}

		if len(userTodos) == 0 {
			return &domain.TodoListResp{Count: 0, List: []*domain.Todo{}}, nil
		}

		todoIds := make([]string, 0, len(userTodos))
		for _, ut := range userTodos {
			todoIds = append(todoIds, ut.TodoId)
		}

		todos, err = l.svcCtx.TodoModel.FindByIds(ctx, todoIds)
		if err != nil {
			return nil, xerr.WithMessage(err, "查询待办列表失败")
		}
		total = int64(len(todos))
	} else {
		todos, total, err = l.svcCtx.TodoModel.List(ctx, "", req.StartTime, req.EndTime, req.Page, req.Count)
		if err != nil {
			return nil, xerr.WithMessage(err, "查询待办列表失败")
		}
	}

	resp = &domain.TodoListResp{
		Count: total,
		List:  make([]*domain.Todo, 0, len(todos)),
	}

	for _, t := range todos {
		resp.List = append(resp.List, &domain.Todo{
			ID:          t.ID.Hex(),
			CreatorId:   t.CreatorId,
			CreatorName: t.CreatorName,
			Title:       t.Title,
			DeadlineAt:  t.DeadlineAt,
			Desc:        t.Desc,
			Status:      t.Status,
			ExecuteIds:  t.ExecuteIds,
			TodoStatus:  t.TodoStatus,
		})
	}

	return resp, nil
}
