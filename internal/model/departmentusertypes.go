package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Departmentuser struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	DepId    string             `bson:"depId,omitempty"`  // 部门ID
	UserId   string             `bson:"userId,omitempty"` // 用户ID
	UpdateAt int64              `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt int64              `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
