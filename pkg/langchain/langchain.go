package langchain

const (
	Input  = "input"        // 输入参数的键名，用于传递用户输入内容
	Output = "text"         // 输出参数的键名，用于返回AI生成的文本内容
	ChatId = "llms.chat.id" // 聊天会话ID的上下文键名，用于标识不同的聊天会话
)

const (
	DefaultHandler = iota
	TodoHandler
)
