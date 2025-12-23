package asynqx

import (
	"context"
	"fmt"

	"github.com/hibiken/asynq"
)

// HandlerFunc 任务处理函数类型
type HandlerFunc func(ctx context.Context, task *asynq.Task) error

// Server Asynq Worker 服务
type Server struct {
	server    *asynq.Server
	mux       *asynq.ServeMux
	enabled   bool
	isRunning bool
}

// NewServer 创建 Worker 服务
func NewServer(redisAddr, password string, db int, concurrency int, enabled bool) *Server {
	if !enabled {
		return &Server{enabled: false}
	}

	if concurrency <= 0 {
		concurrency = 10
	}

	server := asynq.NewServer(
		asynq.RedisClientOpt{
			Addr:     redisAddr,
			Password: password,
			DB:       db,
		},
		asynq.Config{
			Concurrency: concurrency,
			Queues: map[string]int{
				"critical":  6, // 高优先级
				"default":   3, // 默认
				"knowledge": 2, // 知识库处理
				"reminder":  1, // 提醒任务
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				fmt.Printf("[Asynq] Task %s failed: %v\n", task.Type(), err)
			}),
		},
	)

	return &Server{
		server:  server,
		mux:     asynq.NewServeMux(),
		enabled: true,
	}
}

// IsEnabled 是否启用
func (s *Server) IsEnabled() bool {
	return s.enabled
}

// HandleFunc 注册任务处理函数
func (s *Server) HandleFunc(taskType string, handler HandlerFunc) {
	if s.mux != nil {
		s.mux.HandleFunc(taskType, asynq.HandlerFunc(handler))
	}
}

// Run 启动 Worker（阻塞）
func (s *Server) Run() error {
	if !s.enabled {
		fmt.Println("[Asynq] Worker is disabled, skip starting")
		return nil
	}

	s.isRunning = true
	fmt.Println("[Asynq] Worker starting...")
	return s.server.Run(s.mux)
}

// Shutdown 优雅关闭
func (s *Server) Shutdown() {
	if s.server != nil && s.isRunning {
		s.server.Shutdown()
		s.isRunning = false
		fmt.Println("[Asynq] Worker stopped")
	}
}
