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

// ApprovalQueryTool 审批查询工具
type ApprovalQueryTool struct {
	svc          *svc.ServiceContext
	outputparser outputparserx.Structured
}

// NewApprovalQueryTool 创建审批查询工具实例
func NewApprovalQueryTool(svc *svc.ServiceContext) *ApprovalQueryTool {
	return &ApprovalQueryTool{
		svc: svc,
		outputparser: outputparserx.NewStructured([]outputparserx.ResponseSchema{
			{
				Name:        "type",
				Description: "审批类型过滤: 0=全部, 2=请假, 3=补卡, 4=外出, 5=报销, 6=付款, 7=采购, 8=收款",
				Type:        "int",
			},
			{
				Name:        "userId",
				Description: "用户ID，留空查询当前用户的审批",
				Type:        "string",
			},
		}),
	}
}

// Name 返回工具名称
func (t *ApprovalQueryTool) Name() string {
	return "approval_find"
}

// Description 返回工具描述
func (t *ApprovalQueryTool) Description() string {
	return `an approval query interface.
use when you need to find, query, search or list approvals.
use when user asks: "我的审批", "查询审批", "审批记录", "请假记录", "补卡记录", etc.
If user specifies a userId, use that userId. Otherwise query current user's approvals.
keep Chinese output.
` + t.outputparser.GetFormatInstructions()
}

// Call 执行审批查询
func (t *ApprovalQueryTool) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[ApprovalQueryTool] 被调用，输入: %s\n", input)

	// 解析输入
	out, err := t.outputparser.Parse(input)
	if err != nil {
		out = make(map[string]any)
	}

	data := out.(map[string]any)
	if data == nil {
		data = make(map[string]any)
	}

	// 获取当前用户
	uid := token.GetUid(ctx)
	tokenStr, _ := ctx.Value("Authorization").(string)

	// 如果没有指定userId，使用当前用户
	if _, ok := data["userId"]; !ok || data["userId"] == "" {
		data["userId"] = uid
	}
	data["count"] = 10

	// 调用API查询审批
	apiUrl := fmt.Sprintf("http://%s/v1/approval/list", t.svc.Config.Addr)
	fmt.Printf("[ApprovalQueryTool] 调用API: %s, params: %+v\n", apiUrl, data)

	res, err := curl.PostRequest(tokenStr, apiUrl, data)
	if err != nil {
		return "", fmt.Errorf("查询失败: %v", err)
	}
	fmt.Printf("[ApprovalQueryTool] API响应: %s\n", string(res))

	return t.formatApprovalList(res)
}

// formatApprovalList 格式化审批列表输出
func (t *ApprovalQueryTool) formatApprovalList(res []byte) (string, error) {
	var apiResponse struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
		Data struct {
			Count int64                  `json:"count"`
			List  []*domain.ApprovalList `json:"data"`
		} `json:"data"`
	}

	if err := json.Unmarshal(res, &apiResponse); err != nil {
		return "", err
	}

	if apiResponse.Code != 200 {
		return "", fmt.Errorf(apiResponse.Msg)
	}

	if len(apiResponse.Data.List) == 0 {
		return "您当前没有审批记录。", nil
	}

	var result strings.Builder
	result.WriteString("您的审批记录:\n\n")

	for i, approval := range apiResponse.Data.List {
		result.WriteString(fmt.Sprintf("%d. %s\n", i+1, approval.Title))
		result.WriteString(fmt.Sprintf("   编号: %s\n", approval.No))
		result.WriteString(fmt.Sprintf("   类型: %s\n", getApprovalTypeName(approval.Type)))
		result.WriteString(fmt.Sprintf("   状态: %s\n", getApprovalStatusName(approval.Status)))
		result.WriteString(fmt.Sprintf("   创建时间: %s\n", formatTime(approval.CreateAt)))
		if approval.Abstract != "" {
			result.WriteString(fmt.Sprintf("   摘要: %s\n", approval.Abstract))
		}
		result.WriteString("\n")
	}

	return result.String(), nil
}

// getApprovalTypeName 获取审批类型名称
func getApprovalTypeName(t int) string {
	switch t {
	case 1:
		return "通用审批"
	case 2:
		return "请假审批"
	case 3:
		return "补卡审批"
	case 4:
		return "外出审批"
	case 5:
		return "报销审批"
	case 6:
		return "付款审批"
	case 7:
		return "采购审批"
	case 8:
		return "收款审批"
	case 9:
		return "转正审批"
	case 10:
		return "离职审批"
	case 11:
		return "加班审批"
	case 12:
		return "合同审批"
	default:
		return "未知类型"
	}
}

// getApprovalStatusName 获取审批状态名称
func getApprovalStatusName(status int) string {
	switch status {
	case 0:
		return "未开始"
	case 1:
		return "处理中"
	case 2:
		return "已通过"
	case 3:
		return "已拒绝"
	case 4:
		return "已撤销"
	case 5:
		return "自动通过"
	default:
		return "未知状态"
	}
}

// formatTime 格式化时间戳
func formatTime(timestamp int64) string {
	if timestamp == 0 {
		return "未设置"
	}
	return time.Unix(timestamp, 0).Format("2006-01-02 15:04")
}
