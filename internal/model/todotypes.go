package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Todo struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	CreatorId   string             `bson:"creatorId,omitempty" json:"creatorId,omitempty"`
	CreatorName string             `bson:"creatorName,omitempty" json:"creatorName,omitempty"`
	Title       string             `bson:"title,omitempty" json:"title,omitempty"`
	DeadlineAt  int64              `bson:"deadlineAt,omitempty" json:"deadlineAt,omitempty"`
	Desc        string             `bson:"desc,omitempty" json:"desc,omitempty"`
	Status      int                `bson:"status,omitempty" json:"status,omitempty"`
	Records     []*TodoRecord      `bson:"records,omitempty" json:"records,omitempty"`
	ExecuteIds  []string           `bson:"executeIds,omitempty" json:"executeIds,omitempty"` // 待办执行人
	TodoStatus  int                `bson:"todoStatus,omitempty" json:"todoStatus,omitempty"`
	UpdateAt    int64              `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt    int64              `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
