package domain

type Message struct {
	ConversationId string `json:"conversationId"` //会话Id
	RecvId         string `json:"revcId"`         //接收Id
	SendId         string `json:"sendId"`         //发送Id
	ChatType       int    `json:"chatType"`       //chat类型 1=群聊 2=私聊
	Content        string `json:"content"`        //聊天内容
	ContentType    int    `json:"contentType"`    //聊天类型 1=文字 2=图片 3=表情包等
}
