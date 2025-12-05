package svc

import (
	"aiOffice/internal/config"
	"aiOffice/internal/middleware"
	"aiOffice/internal/model"
	"aiOffice/pkg/encrypt"
	"aiOffice/pkg/mongoutils"
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

type ServiceContext struct {
	Config config.Config

	// todo repo and pkg object instance
	Mongo               *mongo.Database
	UserModel           model.UserModel
	DepartmentModel     model.DepartmentModel
	DepartmentuserModel model.DepartmentuserModel
	TodoRecordModel     model.TodoRecordModel
	UserTodo            model.UserTodoModel
	Todo                model.TodoModel
	Jwt                 *middleware.Jwt
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
		Config:              c,
		Mongo:               mongoDB,
		UserModel:           model.NewUserModel(mongoDB),
		DepartmentModel:     model.NewDepartmentModel(mongoDB),
		DepartmentuserModel: model.NewDepartmentuserModel(mongoDB),
		TodoRecordModel:     model.NewTodoRecordModel(mongoDB),
		UserTodo:            model.NewUserTodoModel(mongoDB),
		Todo:                model.NewTodoModel(mongoDB),
		Jwt:                 middleware.NewJwt(c.Jwt.Secret),
	}

	return svc, initAdminUser(svc)
}

func initAdminUser(svc *ServiceContext) error {
	ctx := context.Background()

	// 检查管理员是否存在
	admin, err := svc.UserModel.FindAdminUser(ctx)
	if err != nil && err != model.ErrNotFindUser {
		return err
	}
	if admin != nil {
		return nil
	}
	password, err := encrypt.GenPasswordHash([]byte("root@123"))
	if err != nil {
		return err
	}
	return svc.UserModel.Insert(ctx, &model.User{
		Name:     "root",
		Password: string(password),
		Status:   0,
		IsAdmin:  true,
	})
}
