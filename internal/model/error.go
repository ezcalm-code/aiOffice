package model

import (
	"errors"

	"go.mongodb.org/mongo-driver/mongo"
)

var (
	ErrNotFound          = mongo.ErrNoDocuments
	ErrInvalidObjectId   = errors.New("invalid objectId")
	ErrNotFindUser       = errors.New("找不到该用户")
	ErrNotFindDepartment = errors.New("找不到该部门")
)
