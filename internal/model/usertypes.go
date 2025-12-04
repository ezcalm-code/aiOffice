package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	// TODO: Fill your own fields
	Name     string `bson:"name" json:"name"`
	Password string `bson:"password" json:"password"`
	Status   int    `bson:"status" json:"status"`
	IsAdmin  bool   `bson:"isAdmin" json:"isAdmin"`
	UpdateAt int64  `bson:"updateAt,omitempty" json:"updateAt,omitempty"`
	CreateAt int64  `bson:"createAt,omitempty" json:"createAt,omitempty"`
}
