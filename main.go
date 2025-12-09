package main

import (
	"flag"
	"sync"

	"aiOffice/internal/config"
	"aiOffice/internal/handler/start"
	"aiOffice/internal/handler/ws"
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

var (
	configFile = flag.String("f", "./etc/local/config.yaml", "the config file")
	sw         sync.WaitGroup
)

func main() {
	flag.Parse()

	var cfg config.Config
	conf.MustLoad(*configFile, &cfg)

	// 初始化唯一服务上下文
	svcContext, err := svc.NewServiceContext(cfg)
	if err != nil {
		panic(err)
	}

	sw.Add(1)
	// 运行http服务
	go func() {
		defer sw.Done()
		srv := start.NewHandle(svcContext)
		srv.Run()
	}()

	sw.Add(1)
	// 运行websocket服务
	go func() {
		defer sw.Done()
		srv := ws.NewWs(*svcContext)
		srv.Run()
	}()

	sw.Wait()
}
