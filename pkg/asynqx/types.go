package asynqx

// 任务类型常量
const (
	// 知识库相关
	TypeKnowledgeProcess = "knowledge:process" // 知识库文档处理

	// 定时任务相关
	TypeReminderTodo     = "reminder:todo"     // 待办提醒
	TypeReminderApproval = "reminder:approval" // 审批超时提醒
	TypeDailySummary     = "reminder:daily"    // 每日工作总结
)

// KnowledgeProcessPayload 知识库处理任务载荷
type KnowledgeProcessPayload struct {
	UserID   string `json:"user_id"`
	FilePath string `json:"file_path"`
	FileName string `json:"file_name"`
}

// ReminderTodoPayload 待办提醒任务载荷
type ReminderTodoPayload struct {
	UserID string `json:"user_id,omitempty"` // 空表示全部用户
}

// ReminderApprovalPayload 审批提醒任务载荷
type ReminderApprovalPayload struct {
	UserID string `json:"user_id,omitempty"` // 空表示全部用户
}

// DailySummaryPayload 每日总结任务载荷
type DailySummaryPayload struct {
	UserID string `json:"user_id,omitempty"` // 空表示全部用户
}
