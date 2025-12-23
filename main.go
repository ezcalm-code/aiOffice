package main

import (
	"flag"
	"fmt"
	"sync"

	"aiOffice/internal/config"
	"aiOffice/internal/handler/start"
	"aiOffice/internal/handler/ws"
	"aiOffice/internal/svc"
	"aiOffice/pkg/asynqx/handlers"
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
		srv := ws.NewWs(svcContext)
		srv.Run()
	}()

	// 运行 Asynq 监控面板（如果启用）
	if svcContext.AsynqMonitor.IsEnabled() {
		sw.Add(1)
		go func() {
			defer sw.Done()
			if err := svcContext.AsynqMonitor.Run(); err != nil {
				panic(err)
			}
		}()
	}

	// 运行 Asynq Worker（如果启用）
	if svcContext.AsynqServer.IsEnabled() {
		// 注册任务处理器
		h := handlers.NewHandlers(svcContext)
		h.Register(svcContext.AsynqServer)

		sw.Add(1)
		go func() {
			defer sw.Done()
			fmt.Println("[Asynq] Worker starting...")
			if err := svcContext.AsynqServer.Run(); err != nil {
				fmt.Printf("[Asynq] Worker error: %v\n", err)
			}
		}()
	}

	// 运行 Asynq Scheduler（如果启用）
	if svcContext.AsynqScheduler.IsEnabled() {
		// 注册定时任务
		if _, err := svcContext.AsynqScheduler.RegisterTodoReminder(); err != nil {
			fmt.Printf("[Scheduler] 注册待办提醒失败: %v\n", err)
		}
		if _, err := svcContext.AsynqScheduler.RegisterApprovalReminder(); err != nil {
			fmt.Printf("[Scheduler] 注册审批提醒失败: %v\n", err)
		}
		if _, err := svcContext.AsynqScheduler.RegisterDailySummary(); err != nil {
			fmt.Printf("[Scheduler] 注册每日总结失败: %v\n", err)
		}

		sw.Add(1)
		go func() {
			defer sw.Done()
			fmt.Println("[Scheduler] Scheduler starting...")
			if err := svcContext.AsynqScheduler.Run(); err != nil {
				fmt.Printf("[Scheduler] Scheduler error: %v\n", err)
			}
		}()
	}

	sw.Wait()
}
