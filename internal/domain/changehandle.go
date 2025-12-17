package domain

import "time"

const (
	DefaultHandler = iota // 默认处理器类型
	TodoFind              // 待办查询类型
	TodoAdd               // 待办添加类型
	ApprovalFind          // 审批查询类型
	ApprovalAdd           // 审批创建类型
	ChatLog               // 聊天日志类型
)

// ChatFile 聊天文件信息结构，用于保存到memory中
type ChatFile struct {
	Path string    `json:"path"` // 文件路径
	Name string    `json:"name"` // 文件名称
	Time time.Time `json:"time"` // 上传时间
}
