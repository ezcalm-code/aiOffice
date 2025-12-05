package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Department struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name       string             `bson:"name" json:"name"`                                 // 部门名称
	ParentId   string             `bson:"parentId,omitempty" json:"parentId,omitempty"`     // 父部门ID
	ParentPath string             `bson:"parentPath,omitempty" json:"parentPath,omitempty"` // 父部门路径
	Level      int                `bson:"level" json:"level"`                               // 部门层级
	LeaderId   string             `bson:"leaderId,omitempty" json:"leaderId,omitempty"`     // 部门负责人ID
	Leader     string             `bson:"leader,omitempty" json:"leader,omitempty"`         // 部门负责人姓名
	Count      int64              `bson:"count" json:"count"`                               // 部门人数
	UpdateAt   int64              `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt   int64              `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
