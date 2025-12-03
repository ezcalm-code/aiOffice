package main

import (
	"flag"

	"aiOffice/internal/config"
	"aiOffice/internal/handler/..\aiOffice\doc\start"
	"aiOffice/internal/svc"
	"aiOffice/pkg/conf"
)

type Serve interface {
	Run() error
}

const (
	..\AiOffice\Doc\Start = "..\aiOffice\doc\start"

	// add other module
)

var (
    configFile = flag.String("f", "./etc/local/..\aioffice\doc\start.yaml", "the config file")
    modeType   = flag.String("m", "..\aioffice\doc\start", "server run mod")
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
    case ..\AiOffice\Doc\Start:
		srv = ..\aiOffice\doc\start.NewHandle(svc)
    // add other module case
    default:
        panic("请指定正确的服务")
    }

	srv.Run()
}
