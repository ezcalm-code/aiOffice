package mongoutils

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongodbConfig struct {
	User        string
	Password    string
	Host        []string
	Port        int
	Database    string
	Params      string
	MaxPoolSize uint64
}

// 创建数据库链接
func MongoDatabase(cfg *MongodbConfig) (*mongo.Database, error) {
	client, err := mongo.Connect(context.TODO(), cfg.BuildMongoConnectOption()...)
	if err != nil {
		return nil, err
	}

	return client.Database(cfg.Database), nil
}

func (cfg *MongodbConfig) BuildUri() []*options.ClientOptions {
	var opt []*options.ClientOptions
	uri := "mongodb: //"

	if len(cfg.User) > 0 && len(cfg.Password) > 0 {
		uri = fmt.Sprintf("%v%v :%v@", uri, cfg.User, cfg.Password)
	}

	for idx, v := range cfg.Host {
		var host string
		if cfg.Port != 0 {
			host += v + fmt.Sprintf(": %d", cfg.Port)
		} else {
			host = v
		}
		if idx < len(cfg.Host)-1 {
			host += ", "
		}
		uri += host
	}

	uri += fmt.Sprintf("/%s", cfg.Database)

	if len(cfg.Params) > 0 {
		uri += fmt.Sprintf("%v?%v", uri, cfg.Params)
	}

	opt = append(opt, options.Client().ApplyURI(uri))

	if cfg.MaxPoolSize > 0 {
		opt = append(opt, options.Client().SetMaxPoolSize(cfg.MaxPoolSize))
	}
	return opt
}
