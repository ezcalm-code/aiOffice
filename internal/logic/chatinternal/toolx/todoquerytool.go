package toolx

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"aiOffice/internal/domain"
	"aiOffice/internal/svc"
	"aiOffice/pkg/curl"
	"aiOffice/pkg/langchain/outputparserx"
	"aiOffice/pkg/token"
)

// TodoQueryTool 待办事项查询工具
type TodoQueryTool struct {
	svc          *svc.ServiceContext
	outputparser outputparserx.Structured
}

// NewTodoQueryTool 创建待办事项查询工具实例
func NewTodoQueryTool(svc *svc.ServiceContext) *TodoQueryTool {
	return &TodoQueryTool{
		svc: svc,
		outputparser: outputparserx.NewStructured([]outputparserx.ResponseSchema{
			{
				Name:        "id",
				Description: "todo id, empty if not specified",
				Type:        "string",
			},
			{
				Name:        "startTime",
				Description: "start time Unix timestamp, empty if not specified",
				Type:        "int64",
			},
			{
				Name:        "endTime",
				Description: "end time Unix timestamp, empty if not specified",
				Type:        "int64",
			},
			{
				Name:        "userId",
				Description: "user id to query, empty means current user",
				Type:        "string",
			},
		}),
	}
}

// Name 返回工具名称
func (t *TodoQueryTool) Name() string {
	return "todo_find"
}

// Description 返回工具描述
func (t *TodoQueryTool) Description() string {
	return `a todo find interface.
use when you need to find, query, search or list todos.
use when user asks: "我的待办", "查询待办", "有哪些待办", "待办事项", etc.
If user doesn't provide specific conditions, query all todos by leaving fields empty.
keep Chinese output.
` + t.outputparser.GetFormatInstructions()
}

// Call 执行待办事项查询
func (t *TodoQueryTool) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[TodoQueryTool] 被调用，输入: %s\n", input)

	// 解析输入
	out, err := t.outputparser.Parse(input)
	if err != nil {
		// 如果解析失败，使用空条件查询
		out = make(map[string]any)
	}

	// 构建查询参数
	data := out.(map[string]any)
	if data == nil {
		data = make(map[string]any)
	}

	// 设置当前用户ID
	uid := token.GetUid(ctx)
	tokenStr, _ := ctx.Value("Authorization").(string)

	// 如果没有指定userId，使用当前用户
	if _, ok := data["userId"]; !ok || data["userId"] == "" {
		data["userId"] = uid
	}
	data["count"] = 10

	// 转换时间字段
	conversionTime("startTime", data)
	conversionTime("endTime", data)

	// 调用API查询待办
	apiUrl := fmt.Sprintf("http://%s/v1/todo/list", t.svc.Config.Addr)
	fmt.Printf("[TodoQueryTool] 调用API: %s, params: %+v\n", apiUrl, data)

	res, err := curl.GetRequest(tokenStr, apiUrl, data)
	if err != nil {
		return "", fmt.Errorf("查询失败: %v", err)
	}
	fmt.Printf("[TodoQueryTool] API响应: %s\n", string(res))

	// 格式化输出
	return t.formatTodoList(res)
}

// conversionTime 转换时间字段格式
func conversionTime(field string, data map[string]any) {
	if v, ok := data[field]; ok {
		if tmp, ok := v.(float64); ok {
			data[field] = int64(tmp)
		}
	}
}

// formatTodoList 格式化待办列表输出
func (t *TodoQueryTool) formatTodoList(res []byte) (string, error) {
	// 解析响应
	var apiResponse struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
		Data struct {
			Count int64          `json:"count"`
			List  []*domain.Todo `json:"data"`
		} `json:"data"`
	}

	if err := json.Unmarshal(res, &apiResponse); err != nil {
		return "", err
	}

	if apiResponse.Code != 200 {
		return "", fmt.Errorf(apiResponse.Msg)
	}

	// 如果没有待办
	if apiResponse.Data.List == nil || len(apiResponse.Data.List) == 0 {
		return "您当前没有待办事项。", nil
	}

	// 格式化输出
	var result strings.Builder
	result.WriteString("您的待办事项:\n\n")

	for i, todo := range apiResponse.Data.List {
		result.WriteString(fmt.Sprintf("%d. %s\n", i+1, todo.Title))
		result.WriteString(fmt.Sprintf("   状态: %s\n", getTodoStatusName(todo.TodoStatus)))
		result.WriteString(fmt.Sprintf("   截止时间: %s\n", formatTimestamp(todo.DeadlineAt)))
		if todo.Desc != "" {
			result.WriteString(fmt.Sprintf("   描述: %s\n", todo.Desc))
		}
		result.WriteString("\n")
	}

	return result.String(), nil
}

// getTodoStatusName 获取待办状态名称
func getTodoStatusName(status int) string {
	switch status {
	case 0:
		return "未完成"
	case 1:
		return "已完成"
	default:
		return "未知状态"
	}
}

// formatTimestamp 格式化时间戳
func formatTimestamp(timestamp int64) string {
	if timestamp == 0 {
		return "未设置"
	}
	return time.Unix(timestamp, 0).Format("2006-01-02 15:04")
}
