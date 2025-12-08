package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatLog struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`

	ConversationId string `bson:"conversationId,omitempty" json:"conversationId"` //会话Id
	RecvId         string `bson:"revcId,omitempty" json:"revcId"`                 //接收Id
	SendId         string `bson:"sendId,omitempty" json:"sendId"`                 //发送Id
	ChatType       int    `bson:"chatType,omitempty" json:"chatType"`             //chat类型 1=群聊 2=私聊
	Content        string `bson:"content,omitempty" json:"content"`               //聊天内容
	ContentType    int    `bson:"contentType,omitempty" json:"contentType"`       //聊天类型 1=文字 2=图片 3=表情包等

	UpdateAt int64 `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt int64 `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
