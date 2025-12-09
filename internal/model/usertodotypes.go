package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserTodo struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserId     string             `bson:"userId,omitempty" json:"userId,omitempty"`
	UserName   string             `bson:"userName,omitempty" json:"userName,omitempty"`
	TodoId     string             `bson:"todoId,omitempty" json:"todoId,omitempty"`
	TodoStatus int                `bson:"todoStatus,omitempty" json:"todoStatus,omitempty"` // 待办事项的状态
	UpdateAt   int64              `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt   int64              `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
