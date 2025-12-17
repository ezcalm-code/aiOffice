package toolx

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"aiOffice/internal/svc"
	"aiOffice/pkg/curl"
	"aiOffice/pkg/token"
)

// TodoTool AI创建待办事项的工具
type TodoTool struct {
	svc *svc.ServiceContext
}

// NewTodoTool 创建TodoTool实例
func NewTodoTool(svc *svc.ServiceContext) *TodoTool {
	return &TodoTool{svc: svc}
}

// Name 工具名称
func (t *TodoTool) Name() string {
	return "create_todo"
}

// Description 工具描述，让LLM理解何时使用此工具
func (t *TodoTool) Description() string {
	return `用于创建待办事项。当用户要求创建待办、任务、提醒时使用此工具。
输入格式为JSON: {"title": "待办标题", "desc": "待办描述", "deadlineAt": 截止时间戳(可选), "executeIds": ["执行人ID"](可选)}
示例: {"title": "完成项目报告", "desc": "编写Q4季度项目总结报告", "deadlineAt": 1735689600}`
}

// TodoInput 待办输入参数
type TodoInput struct {
	Title      string   `json:"title"`                // 待办标题
	Desc       string   `json:"desc,omitempty"`       // 待办描述
	DeadlineAt int64    `json:"deadlineAt,omitempty"` // 截止时间戳
	ExecuteIds []string `json:"executeIds,omitempty"` // 执行人ID列表
}

// TodoRequest 调用API的请求体
type TodoRequest struct {
	CreatorId   string   `json:"creatorId"`
	CreatorName string   `json:"creatorName"`
	Title       string   `json:"title"`
	Desc        string   `json:"desc,omitempty"`
	DeadlineAt  int64    `json:"deadlineAt,omitempty"`
	ExecuteIds  []string `json:"executeIds,omitempty"`
	Status      int      `json:"status"`
}

// Call 执行工具调用
func (t *TodoTool) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[TodoTool] 被调用，输入: %s\n", input)

	// 解析输入参数
	var todoInput TodoInput
	if err := json.Unmarshal([]byte(input), &todoInput); err != nil {
		return "", fmt.Errorf("解析输入参数失败: %v", err)
	}

	// 验证必填参数
	if todoInput.Title == "" {
		return "", fmt.Errorf("待办标题不能为空")
	}

	// 获取当前用户ID
	uid := token.GetUid(ctx)
	// 从context获取token（如果有的话）
	tokenStr, _ := ctx.Value("Authorization").(string)

	creatorId := uid
	if creatorId == "" {
		creatorId = "system"
	}

	// 获取创建者名称
	creatorName := "系统"
	if creatorId != "system" {
		user, err := t.svc.UserModel.FindOne(ctx, creatorId)
		if err == nil {
			creatorName = user.Name
		}
	}

	// 如果没有设置截止时间，默认为7天后
	if todoInput.DeadlineAt == 0 {
		todoInput.DeadlineAt = time.Now().Add(7 * 24 * time.Hour).Unix()
	}

	// 如果没有指定执行人，默认为创建者自己
	if len(todoInput.ExecuteIds) == 0 && creatorId != "system" {
		todoInput.ExecuteIds = []string{creatorId}
	}

	// 构建请求体
	reqBody := TodoRequest{
		CreatorId:   creatorId,
		CreatorName: creatorName,
		Title:       todoInput.Title,
		Desc:        todoInput.Desc,
		DeadlineAt:  todoInput.DeadlineAt,
		ExecuteIds:  todoInput.ExecuteIds,
		Status:      0,
	}

	// 调用本地Todo API
	apiUrl := fmt.Sprintf("http://%s/v1/todo", t.svc.Config.Addr)
	fmt.Printf("[TodoTool] 调用API: %s, body: %+v\n", apiUrl, reqBody)

	resp, err := curl.PostRequest(tokenStr, apiUrl, reqBody)
	if err != nil {
		fmt.Printf("[TodoTool] API调用失败: %v\n", err)
		return "", fmt.Errorf("调用Todo API失败: %v", err)
	}
	fmt.Printf("[TodoTool] API响应: %s\n", string(resp))

	// 解析响应
	var apiResp struct {
		Code int `json:"code"`
		Data struct {
			Id string `json:"id"`
		} `json:"data"`
		Msg string `json:"msg"`
	}
	if err := json.Unmarshal(resp, &apiResp); err != nil {
		return "", fmt.Errorf("解析API响应失败: %v", err)
	}

	if apiResp.Code != 200 {
		return "", fmt.Errorf("创建待办失败: %s", apiResp.Msg)
	}

	// 返回成功信息
	result := map[string]any{
		"success": true,
		"message": fmt.Sprintf("待办事项「%s」创建成功", todoInput.Title),
		"todoId":  apiResp.Data.Id,
	}
	resultJSON, _ := json.Marshal(result)
	return string(resultJSON), nil
}
