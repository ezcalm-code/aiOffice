package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ChatType 聊天类型枚举
type ChatType int

const (
	GroupChatType  ChatType = iota + 1 // 群聊类型，值为1
	SingleChatType                     // 私聊类型，值为2
)

type ChatLog struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`

	ConversationId string   `bson:"conversationId,omitempty" json:"conversationId"` //会话Id
	RecvId         string   `bson:"revcId,omitempty" json:"revcId"`                 //接收Id
	SendId         string   `bson:"sendId,omitempty" json:"sendId"`                 //发送Id
	ChatType       ChatType `bson:"chatType,omitempty" json:"chatType"`             //chat类型 1=群聊 2=私聊
	MsgContent     string   `bson:"msgContent,omitempty" json:"msgContent"`         //聊天内容
	SendTime       int64    `bson:"SendTime,omitempty" json:"SendTime"`             //发送时间戳

	UpdateAt int64 `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt int64 `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
