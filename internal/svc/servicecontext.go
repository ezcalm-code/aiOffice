package svc

import (
	"aiOffice/internal/config"
	"aiOffice/internal/model"
	"aiOffice/pkg/mongoutils"

	"go.mongodb.org/mongo-driver/mongo"
)

type ServiceContext struct {
	Config config.Config

	// todo repo and pkg object instance
	Mongo     *mongo.Database
	UserModel model.UserModel
}

func NewServiceContext(c config.Config) (*ServiceContext, error) {

	mongoDB, err := mongoutils.MongoDatabase(&mongoutils.MongodbConfig{
		User:     c.Mongo.User,
		Password: c.Mongo.Password,
		Host:     c.Mongo.Host,
		Port:     c.Mongo.Port,
		Database: c.Mongo.Database,
	})
	if err != nil {
		return nil, err
	}

	return &ServiceContext{
		Config:    c,
		Mongo:     mongoDB,
		UserModel: model.NewUserModel(mongoDB),
	}, nil
}
