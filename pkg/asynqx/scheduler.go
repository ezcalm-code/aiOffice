package asynqx

import (
	"fmt"

	"github.com/hibiken/asynq"
)

// Scheduler 定时任务调度器
type Scheduler struct {
	scheduler *asynq.Scheduler
	enabled   bool
	isRunning bool
}

// NewScheduler 创建定时任务调度器
func NewScheduler(redisAddr, password string, db int, enabled bool) *Scheduler {
	if !enabled {
		return &Scheduler{enabled: false}
	}

	scheduler := asynq.NewScheduler(
		asynq.RedisClientOpt{
			Addr:     redisAddr,
			Password: password,
			DB:       db,
		},
		nil,
	)

	return &Scheduler{
		scheduler: scheduler,
		enabled:   true,
	}
}

// IsEnabled 是否启用
func (s *Scheduler) IsEnabled() bool {
	return s.enabled
}

// Register 注册定时任务
// cronSpec: cron 表达式，如 "0 9 * * *" 表示每天 9:00
func (s *Scheduler) Register(cronSpec, taskType string, payload []byte, opts ...asynq.Option) (string, error) {
	if !s.enabled {
		return "", fmt.Errorf("scheduler is disabled")
	}

	task := asynq.NewTask(taskType, payload)
	entryID, err := s.scheduler.Register(cronSpec, task, opts...)
	if err != nil {
		return "", fmt.Errorf("register task failed: %w", err)
	}

	fmt.Printf("[Scheduler] Registered task %s with cron %s, entryID: %s\n", taskType, cronSpec, entryID)
	return entryID, nil
}

// RegisterTodoReminder 注册待办提醒（每天 9:00）
func (s *Scheduler) RegisterTodoReminder() (string, error) {
	return s.Register(
		"0 9 * * *", // 每天 9:00
		TypeReminderTodo,
		[]byte("{}"),
		asynq.Queue("reminder"),
	)
}

// RegisterApprovalReminder 注册审批超时提醒（每天 10:00 和 15:00）
func (s *Scheduler) RegisterApprovalReminder() (string, error) {
	return s.Register(
		"0 10,15 * * *", // 每天 10:00 和 15:00
		TypeReminderApproval,
		[]byte("{}"),
		asynq.Queue("reminder"),
	)
}

// RegisterDailySummary 注册每日总结（每天 18:00）
func (s *Scheduler) RegisterDailySummary() (string, error) {
	return s.Register(
		"0 18 * * *", // 每天 18:00
		TypeDailySummary,
		[]byte("{}"),
		asynq.Queue("reminder"),
	)
}

// Run 启动调度器（阻塞）
func (s *Scheduler) Run() error {
	if !s.enabled {
		fmt.Println("[Scheduler] Scheduler is disabled, skip starting")
		return nil
	}

	s.isRunning = true
	fmt.Println("[Scheduler] Scheduler starting...")
	return s.scheduler.Run()
}

// Shutdown 关闭调度器
func (s *Scheduler) Shutdown() error {
	if s.scheduler != nil && s.isRunning {
		s.scheduler.Shutdown()
		s.isRunning = false
		fmt.Println("[Scheduler] Scheduler stopped")
	}
	return nil
}
