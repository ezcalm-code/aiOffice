package toolx

import (
	"context"
	"encoding/json"
	"fmt"

	"aiOffice/internal/domain"
	"aiOffice/internal/svc"
	"aiOffice/pkg/curl"
	"aiOffice/pkg/langchain/outputparserx"
	"aiOffice/pkg/token"
)

const Success = "success"

// TodoTool 待办事项添加工具
type TodoTool struct {
	svc          *svc.ServiceContext
	outputparser outputparserx.Structured
}

// NewTodoTool 创建待办事项添加工具实例
func NewTodoTool(svc *svc.ServiceContext) *TodoTool {
	return &TodoTool{
		svc: svc,
		outputparser: outputparserx.NewStructured([]outputparserx.ResponseSchema{
			{
				Name:        "title",
				Description: "todo title",
				Require:     true,
			},
			{
				Name:        "deadlineAt",
				Description: "the deadline Unix timestamp (in seconds)",
				Type:        "int64",
			},
			{
				Name:        "desc",
				Description: "todo description",
			},
			{
				Name:        "executeIds",
				Description: "list of user IDs for the todo executors, data type is []string. If user does not specify executors, use current user's ID as the default executor.",
				Type:        "[]string",
				Require:     true,
			},
		}),
	}
}

// Name 返回工具名称
func (t *TodoTool) Name() string {
	return "todo_add"
}

// Description 返回工具描述
func (t *TodoTool) Description() string {
	return `a todo add interface.
use when you need to create a todo.
keep Chinese output.
IMPORTANT: executeIds is required. If user does not specify who should execute the todo, use the current user's ID (provided in context) as the default executor.
` + t.outputparser.GetFormatInstructions()
}

// Call 执行待办事项创建
func (t *TodoTool) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[TodoTool] 被调用，输入: %s\n", input)

	// 解析输入
	data, err := t.outputparser.Parse(input)
	if err != nil {
		return "", err
	}

	// 获取当前用户信息
	uid := token.GetUid(ctx)
	tokenStr, _ := ctx.Value("Authorization").(string)

	// 设置创建者信息
	dataMap := data.(map[string]any)
	if uid != "" {
		dataMap["creatorId"] = uid
		user, err := t.svc.UserModel.FindOne(ctx, uid)
		if err == nil {
			dataMap["creatorName"] = user.Name
		}
		// 如果AI没有传executeIds，默认使用当前用户
		if dataMap["executeIds"] == nil {
			dataMap["executeIds"] = []string{uid}
		}
	}

	// 调用API创建待办
	apiUrl := fmt.Sprintf("http://%s/v1/todo", t.svc.Config.Addr)
	fmt.Printf("[TodoTool] 调用API: %s\n", apiUrl)

	res, err := curl.PostRequest(tokenStr, apiUrl, dataMap)
	if err != nil {
		return "", fmt.Errorf("调用API失败: %v", err)
	}
	fmt.Printf("[TodoTool] API响应: %s\n", string(res))

	// 解析响应
	var idResp domain.IdRespInfo
	if err := json.Unmarshal(res, &idResp); err != nil {
		return "", err
	}

	return Success + "\n创建的待办ID: " + idResp.Data.Id, nil
}
