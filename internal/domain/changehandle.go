package domain

const (
	DefaultHandler = iota // 默认处理器类型
	TodoFind              // 待办查询类型
	TodoAdd               // 待办添加类型
	ApprovalFind          // 审批查询类型
	ApprovalAdd           // 审批创建类型
	ChatLog               // 聊天日志类型
)
