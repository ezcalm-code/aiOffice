package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"aiOffice/internal/model"
	"aiOffice/internal/svc"
	"aiOffice/pkg/asynqx"

	"github.com/hibiken/asynq"
	"go.mongodb.org/mongo-driver/bson"
)

// Handlers 任务处理器集合
type Handlers struct {
	svc *svc.ServiceContext
}

// NewHandlers 创建任务处理器
func NewHandlers(svc *svc.ServiceContext) *Handlers {
	return &Handlers{svc: svc}
}

// Register 注册所有任务处理器到 Server
func (h *Handlers) Register(server *asynqx.Server) {
	server.HandleFunc(asynqx.TypeReminderTodo, h.HandleTodoReminder)
	server.HandleFunc(asynqx.TypeReminderApproval, h.HandleApprovalReminder)
	server.HandleFunc(asynqx.TypeDailySummary, h.HandleDailySummary)
	server.HandleFunc(asynqx.TypeKnowledgeProcess, h.HandleKnowledgeProcess)
}

// HandleTodoReminder 处理待办提醒任务
func (h *Handlers) HandleTodoReminder(ctx context.Context, task *asynq.Task) error {
	var payload asynqx.ReminderTodoPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("unmarshal payload failed: %w", err)
	}

	fmt.Printf("[TodoReminder] 开始执行待办提醒任务, userID: %s\n", payload.UserID)

	// 获取今天的时间范围
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()
	todayEnd := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 0, now.Location()).Unix()

	// 查询今天到期的待办
	todos, err := h.findTodayTodos(ctx, payload.UserID, todayStart, todayEnd)
	if err != nil {
		return fmt.Errorf("query todos failed: %w", err)
	}

	if len(todos) == 0 {
		fmt.Println("[TodoReminder] 没有今天到期的待办")
		return nil
	}

	// 按用户分组发送提醒
	userTodos := make(map[string][]*model.Todo)
	for _, todo := range todos {
		userTodos[todo.CreatorId] = append(userTodos[todo.CreatorId], todo)
	}

	for userID, userTodoList := range userTodos {
		msg := h.buildTodoReminderMessage(userTodoList)
		fmt.Printf("[TodoReminder] 向用户 %s 发送提醒: %s\n", userID, msg)
		// TODO: 通过 WebSocket 发送消息给用户
	}

	fmt.Printf("[TodoReminder] 完成，共提醒 %d 个待办\n", len(todos))
	return nil
}

// HandleApprovalReminder 处理审批超时提醒任务
func (h *Handlers) HandleApprovalReminder(ctx context.Context, task *asynq.Task) error {
	var payload asynqx.ReminderApprovalPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("unmarshal payload failed: %w", err)
	}

	fmt.Printf("[ApprovalReminder] 开始执行审批提醒任务, userID: %s\n", payload.UserID)

	// 查询待处理超过24小时的审批
	approvals, err := h.findPendingApprovals(ctx, payload.UserID)
	if err != nil {
		return fmt.Errorf("query approvals failed: %w", err)
	}

	if len(approvals) == 0 {
		fmt.Println("[ApprovalReminder] 没有待处理的审批")
		return nil
	}

	// 按审批人分组发送提醒
	userApprovals := make(map[string][]*model.Approval)
	for _, approval := range approvals {
		userApprovals[approval.ApprovalId] = append(userApprovals[approval.ApprovalId], approval)
	}

	for userID, userApprovalList := range userApprovals {
		msg := h.buildApprovalReminderMessage(userApprovalList)
		fmt.Printf("[ApprovalReminder] 向用户 %s 发送提醒: %s\n", userID, msg)
		// TODO: 通过 WebSocket 发送消息给用户
	}

	fmt.Printf("[ApprovalReminder] 完成，共提醒 %d 个审批\n", len(approvals))
	return nil
}

// HandleDailySummary 处理每日工作总结任务
func (h *Handlers) HandleDailySummary(ctx context.Context, task *asynq.Task) error {
	var payload asynqx.DailySummaryPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("unmarshal payload failed: %w", err)
	}

	fmt.Printf("[DailySummary] 开始生成每日工作总结, userID: %s\n", payload.UserID)

	// 获取今天的时间范围
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()
	todayEnd := now.Unix()

	// 统计今日完成的待办
	completedTodos, err := h.countCompletedTodos(ctx, payload.UserID, todayStart, todayEnd)
	if err != nil {
		fmt.Printf("[DailySummary] 统计待办失败: %v\n", err)
	}

	// 统计今日处理的审批
	processedApprovals, err := h.countProcessedApprovals(ctx, payload.UserID, todayStart, todayEnd)
	if err != nil {
		fmt.Printf("[DailySummary] 统计审批失败: %v\n", err)
	}

	summary := fmt.Sprintf("📊 今日工作总结\n- 完成待办: %d 项\n- 处理审批: %d 项",
		completedTodos, processedApprovals)

	fmt.Printf("[DailySummary] %s\n", summary)
	// TODO: 通过 WebSocket 发送给用户或保存到数据库

	return nil
}

// HandleKnowledgeProcess 处理知识库文档任务（预留）
func (h *Handlers) HandleKnowledgeProcess(ctx context.Context, task *asynq.Task) error {
	var payload asynqx.KnowledgeProcessPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("unmarshal payload failed: %w", err)
	}

	fmt.Printf("[KnowledgeProcess] 开始处理文档: %s\n", payload.FileName)

	// TODO: 实现文档处理逻辑
	// 1. 读取文件
	// 2. 解析文档
	// 3. 分块
	// 4. 向量化
	// 5. 存储到 Redis

	fmt.Printf("[KnowledgeProcess] 文档处理完成: %s\n", payload.FileName)
	return nil
}

// findTodayTodos 查询今天到期的待办
func (h *Handlers) findTodayTodos(ctx context.Context, userID string, startTime, endTime int64) ([]*model.Todo, error) {
	col := h.svc.Mongo.Collection("todo")

	filter := bson.M{
		"deadlineAt": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
		"todoStatus": bson.M{"$ne": 2}, // 未完成
	}

	if userID != "" {
		filter["creatorId"] = userID
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var todos []*model.Todo
	if err := cursor.All(ctx, &todos); err != nil {
		return nil, err
	}

	return todos, nil
}

// findPendingApprovals 查询待处理的审批（超过24小时）
func (h *Handlers) findPendingApprovals(ctx context.Context, userID string) ([]*model.Approval, error) {
	col := h.svc.Mongo.Collection("approval")

	// 24小时前
	threshold := time.Now().Add(-24 * time.Hour).Unix()

	filter := bson.M{
		"status":   model.Processed, // 处理中
		"createAt": bson.M{"$lt": threshold},
	}

	if userID != "" {
		filter["approvalId"] = userID
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var approvals []*model.Approval
	if err := cursor.All(ctx, &approvals); err != nil {
		return nil, err
	}

	return approvals, nil
}

// countCompletedTodos 统计今日完成的待办数量
func (h *Handlers) countCompletedTodos(ctx context.Context, userID string, startTime, endTime int64) (int64, error) {
	col := h.svc.Mongo.Collection("todo")

	filter := bson.M{
		"todoStatus": 2, // 已完成
		"updateAt": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
	}

	if userID != "" {
		filter["creatorId"] = userID
	}

	return col.CountDocuments(ctx, filter)
}

// countProcessedApprovals 统计今日处理的审批数量
func (h *Handlers) countProcessedApprovals(ctx context.Context, userID string, startTime, endTime int64) (int64, error) {
	col := h.svc.Mongo.Collection("approval")

	filter := bson.M{
		"status": bson.M{"$in": []model.ApprovalStatus{model.Pass, model.Refuse}},
		"finishAt": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
	}

	if userID != "" {
		filter["userId"] = userID
	}

	return col.CountDocuments(ctx, filter)
}

// buildTodoReminderMessage 构建待办提醒消息
func (h *Handlers) buildTodoReminderMessage(todos []*model.Todo) string {
	if len(todos) == 0 {
		return ""
	}

	msg := fmt.Sprintf("📋 您有 %d 个待办今天到期：\n", len(todos))
	for i, todo := range todos {
		if i >= 5 {
			msg += fmt.Sprintf("... 还有 %d 个\n", len(todos)-5)
			break
		}
		msg += fmt.Sprintf("- %s\n", todo.Title)
	}
	return msg
}

// buildApprovalReminderMessage 构建审批提醒消息
func (h *Handlers) buildApprovalReminderMessage(approvals []*model.Approval) string {
	if len(approvals) == 0 {
		return ""
	}

	msg := fmt.Sprintf("⏰ 您有 %d 个审批待处理（超过24小时）：\n", len(approvals))
	for i, approval := range approvals {
		if i >= 5 {
			msg += fmt.Sprintf("... 还有 %d 个\n", len(approvals)-5)
			break
		}
		msg += fmt.Sprintf("- [%s] %s\n", approval.Type.ToString(), approval.Title)
	}
	return msg
}
