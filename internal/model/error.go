package model

import (
	"errors"

	"go.mongodb.org/mongo-driver/mongo"
)

var (
	ErrNotFound        = mongo.ErrNoDocuments
	ErrInvalidObjectId = errors.New("invalid objectId")
	ErrNotUser         = errors.New("找不到该用户")
)
