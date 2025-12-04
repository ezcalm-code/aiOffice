package main

import (
	"flag"

	"aiOffice/internal/aiOffice/doc/start"
	"aiOffice/internal/config"
	"aiOffice/internal/svc"
	"aiOffice/pkg/conf"
)

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
