package asynqx

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

// Client Asynq 客户端封装
type Client struct {
	client  *asynq.Client
	enabled bool
}

// NewClient 创建 Asynq 客户端
func NewClient(redisAddr, password string, db int, enabled bool) *Client {
	if !enabled {
		return &Client{enabled: false}
	}

	client := asynq.NewClient(asynq.RedisClientOpt{
		Addr:     redisAddr,
		Password: password,
		DB:       db,
	})

	return &Client{
		client:  client,
		enabled: true,
	}
}

// IsEnabled 是否启用
func (c *Client) IsEnabled() bool {
	return c.enabled
}

// Close 关闭客户端
func (c *Client) Close() error {
	if c.client != nil {
		return c.client.Close()
	}
	return nil
}

// Enqueue 提交任务
func (c *Client) Enqueue(ctx context.Context, taskType string, payload any, opts ...asynq.Option) (*asynq.TaskInfo, error) {
	if !c.enabled {
		return nil, fmt.Errorf("asynq is disabled")
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload failed: %w", err)
	}

	task := asynq.NewTask(taskType, data)
	return c.client.EnqueueContext(ctx, task, opts...)
}

// EnqueueKnowledgeProcess 提交知识库处理任务
func (c *Client) EnqueueKnowledgeProcess(ctx context.Context, payload *KnowledgeProcessPayload) (*asynq.TaskInfo, error) {
	return c.Enqueue(ctx, TypeKnowledgeProcess, payload,
		asynq.MaxRetry(3),
		asynq.Timeout(10*time.Minute),
		asynq.Queue("knowledge"),
	)
}

// EnqueueReminderTodo 提交待办提醒任务
func (c *Client) EnqueueReminderTodo(ctx context.Context, payload *ReminderTodoPayload) (*asynq.TaskInfo, error) {
	return c.Enqueue(ctx, TypeReminderTodo, payload,
		asynq.MaxRetry(2),
		asynq.Timeout(5*time.Minute),
		asynq.Queue("reminder"),
	)
}

// EnqueueReminderApproval 提交审批提醒任务
func (c *Client) EnqueueReminderApproval(ctx context.Context, payload *ReminderApprovalPayload) (*asynq.TaskInfo, error) {
	return c.Enqueue(ctx, TypeReminderApproval, payload,
		asynq.MaxRetry(2),
		asynq.Timeout(5*time.Minute),
		asynq.Queue("reminder"),
	)
}

// EnqueueDailySummary 提交每日总结任务
func (c *Client) EnqueueDailySummary(ctx context.Context, payload *DailySummaryPayload) (*asynq.TaskInfo, error) {
	return c.Enqueue(ctx, TypeDailySummary, payload,
		asynq.MaxRetry(2),
		asynq.Timeout(10*time.Minute),
		asynq.Queue("reminder"),
	)
}
