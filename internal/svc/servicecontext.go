package svc

import (
	"aiOffice/internal/config"
	"aiOffice/internal/model"
	"aiOffice/pkg/mongoutils"
	"context"

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

	svc := &ServiceContext{
		Config:    c,
		Mongo:     mongoDB,
		UserModel: model.NewUserModel(mongoDB),
	}

	return svc, initAdminUser(svc)
}

func initAdminUser(svc *ServiceContext) error {
	ctx := context.Background()

	// 检查管理员是否存在
	admin, err := svc.UserModel.FindAdminUser(ctx)
	if err != nil && err != model.ErrNotUser {
		return err
	}
	if admin != nil {
		return nil
	}
	return svc.UserModel.Insert(ctx, &model.User{
		Name:     "root",
		Password: "root@123",
		Status:   0,
		IsAdmin:  true,
	})
}
