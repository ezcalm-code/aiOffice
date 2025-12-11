package svc

import (
	"aiOffice/internal/config"
	"aiOffice/internal/middleware"
	"aiOffice/internal/model"
	"aiOffice/pkg/encrypt"
	"aiOffice/pkg/langchain/callbackx"
	"aiOffice/pkg/mongoutils"
	"context"

	"gitee.com/dn-jinmin/tlog"
	"github.com/tmc/langchaingo/callbacks"
	"github.com/tmc/langchaingo/llms/openai"
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
	UserTodoModel       model.UserTodoModel
	TodoModel           model.TodoModel
	ApprovalModel       model.ApprovalModel
	ChatLogModel        model.ChatLogModel
	Jwt                 *middleware.Jwt
	LLM                 *openai.LLM
	Cb                  callbacks.Handler
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

	log := tlog.NewLogger()
	callbacks := callbacks.CombiningHandler{
		Callbacks: []callbacks.Handler{
			callbackx.NewLogHandler(log),
		},
	}

	options := []openai.Option{
		openai.WithBaseURL(c.LangChain.Url),
		openai.WithToken(c.LangChain.ApiKey),
		openai.WithCallback(callbacks),
		openai.WithEmbeddingModel("text-embedding-v3"),
		openai.WithModel("qwen3-max"),
	}
	llm, err := openai.New(options...)
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
		UserTodoModel:       model.NewUserTodoModel(mongoDB),
		TodoModel:           model.NewTodoModel(mongoDB),
		ApprovalModel:       model.NewApprovalModel(mongoDB),
		ChatLogModel:        model.NewChatLogModel(mongoDB),
		Jwt:                 middleware.NewJwt(c.Jwt.Secret),
		LLM:                 llm,
		Cb:                  callbacks,
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
