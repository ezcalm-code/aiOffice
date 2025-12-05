package main

import (
	"flag"

	"aiOffice/internal/config"
	"aiOffice/internal/handler/start"
	"aiOffice/internal/svc"
	"aiOffice/pkg/conf"
)

// @title AIOffice API
// @version 1.0
// @description AIOffice 接口文档
// @termsOfService http://swagger.io/terms/

// @contact.name wsj
// @contact.email your-email@example.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8001
// @BasePath /

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description JWT token, format: Bearer {token}

type Serve interface {
	Run() error
}

const (
	StartAPI = "./doc/start.api"

	// add other module
)

var (
	configFile = flag.String("f", "./etc/local/config.yaml", "the config file")
	modeType   = flag.String("m", "./doc/start.api", "server run mod")
)

func main() {
	flag.Parse()

	var cfg config.Config
	conf.MustLoad(*configFile, &cfg)

	svc, err := svc.NewServiceContext(cfg)
	if err != nil {
		panic(err)
	}

	var srv Serve
	switch *modeType {
	case StartAPI:
		srv = start.NewHandle(svc)
	// add other module case
	default:
		panic("请指定正确的服务")
	}

	srv.Run()
}
