package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TodoRecord struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	TodoId   string             `bson:"todoId,omitempty" json:"todoId,omitempty"`
	UserId   string             `bson:"userId,omitempty" json:"userId,omitempty"`
	UserName string             `bson:"userName,omitempty" json:"userName,omitempty"`
	Content  string             `bson:"content,omitempty" json:"content,omitempty"`
	Image    string             `bson:"image,omitempty" json:"image,omitempty"`
	UpdateAt int64              `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt int64              `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
