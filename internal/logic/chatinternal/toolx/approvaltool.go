package toolx

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"aiOffice/internal/svc"
	"aiOffice/pkg/curl"
	"aiOffice/pkg/langchain/outputparserx"
	"aiOffice/pkg/token"
)

// ApprovalTool 审批创建工具
type ApprovalTool struct {
	svc          *svc.ServiceContext
	outputparser outputparserx.Structured
}

// NewApprovalTool 创建审批工具实例
func NewApprovalTool(svc *svc.ServiceContext) *ApprovalTool {
	return &ApprovalTool{
		svc: svc,
		outputparser: outputparserx.NewStructured([]outputparserx.ResponseSchema{
			{
				Name:        "type",
				Description: "审批类型: 2=请假, 3=补卡, 4=外出",
				Type:        "int",
			},
			{
				Name:        "leaveType",
				Description: "请假类型(仅type=2时需要): 1=事假, 2=调休, 3=病假, 4=年假, 5=产假, 6=陪产假, 7=婚假, 8=丧假, 9=哺乳假",
				Type:        "int",
			},
			{
				Name:        "startTime",
				Description: "开始时间 Unix timestamp (秒)",
				Type:        "int64",
			},
			{
				Name:        "endTime",
				Description: "结束时间 Unix timestamp (秒)",
				Type:        "int64",
			},
			{
				Name:        "reason",
				Description: "申请理由",
				Type:        "string",
			},
			{
				Name:        "checkType",
				Description: "补卡类型(仅type=3时需要): 1=上班卡, 2=下班卡",
				Type:        "int",
			},
			{
				Name:        "date",
				Description: "补卡日期 Unix timestamp (仅type=3时需要)",
				Type:        "int64",
			},
		}),
	}
}

// Name 返回工具名称
func (t *ApprovalTool) Name() string {
	return "approval_add"
}

// Description 返回工具描述
func (t *ApprovalTool) Description() string {
	return `an approval creation interface.
use when you need to create an approval request.
支持的审批类型:
- 请假审批(type=2): 需要leaveType, startTime, endTime, reason
- 补卡审批(type=3): 需要date, checkType, reason
- 外出审批(type=4): 需要startTime, endTime, reason
keep Chinese output.
` + t.outputparser.GetFormatInstructions()
}

// Call 执行审批创建
func (t *ApprovalTool) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[ApprovalTool] 被调用，输入: %s\n", input)

	// 解析输入
	out, err := t.outputparser.Parse(input)
	if err != nil {
		return "", fmt.Errorf("解析输入失败: %v", err)
	}

	data := out.(map[string]any)
	if data == nil {
		return "", fmt.Errorf("无效的输入数据")
	}

	// 获取当前用户
	uid := token.GetUid(ctx)
	tokenStr, _ := ctx.Value("Authorization").(string)

	// 获取审批类型和理由
	approvalType := int(getFloat64(data, "type"))
	reason := getString(data, "reason")

	// 构建审批请求
	approvalReq := map[string]any{
		"userId": uid,
		"type":   approvalType,
		"reason": reason,
	}

	switch approvalType {
	case 2: // 请假
		leaveType := int(getFloat64(data, "leaveType"))
		if leaveType == 0 {
			leaveType = 1 // 默认事假
		}
		startTime := int64(getFloat64(data, "startTime"))
		endTime := int64(getFloat64(data, "endTime"))
		// 计算请假天数
		days := float64(endTime-startTime) / 86400
		if days < 1 {
			approvalReq["abstract"] = reason
		} else {
			approvalReq["abstract"] = fmt.Sprintf("请假%.0f天", days)
		}
		approvalReq["leave"] = map[string]any{
			"type":      leaveType,
			"startTime": startTime,
			"endTime":   endTime,
			"reason":    reason,
			"timeType":  1, // 默认按小时
		}
	case 3: // 补卡
		checkType := int(getFloat64(data, "checkType"))
		if checkType == 0 {
			checkType = 1 // 默认上班卡
		}
		date := int64(getFloat64(data, "date"))
		if date == 0 {
			date = time.Now().Unix()
		}
		// day 需要是 int64 格式，如 20240530
		tm := time.Unix(date, 0)
		day := int64(tm.Year()*10000 + int(tm.Month())*100 + tm.Day())
		checkTypeName := "上班"
		if checkType == 2 {
			checkTypeName = "下班"
		}
		// 格式: 12月8日上班补卡
		approvalReq["abstract"] = fmt.Sprintf("%d月%d日%s补卡", tm.Month(), tm.Day(), checkTypeName)
		approvalReq["makeCard"] = map[string]any{
			"date":          date,
			"reason":        reason,
			"day":           day,
			"workCheckType": checkType,
		}
	case 4: // 外出
		startTime := int64(getFloat64(data, "startTime"))
		endTime := int64(getFloat64(data, "endTime"))
		duration := float32(endTime-startTime) / 3600 // 计算时长(小时)
		// 格式: 外出拜访客户
		approvalReq["abstract"] = fmt.Sprintf("外出%s", reason)
		approvalReq["goOut"] = map[string]any{
			"startTime": startTime,
			"endTime":   endTime,
			"duration":  duration,
			"reason":    reason,
		}
	default:
		return "", fmt.Errorf("不支持的审批类型: %d", approvalType)
	}

	// 调用API创建审批
	apiUrl := fmt.Sprintf("http://%s/v1/approval", t.svc.Config.Addr)
	fmt.Printf("[ApprovalTool] 调用API: %s, body: %+v\n", apiUrl, approvalReq)

	res, err := curl.PostRequest(tokenStr, apiUrl, approvalReq)
	if err != nil {
		return "", fmt.Errorf("创建审批失败: %v", err)
	}
	fmt.Printf("[ApprovalTool] API响应: %s\n", string(res))

	// 解析响应
	var apiResponse struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
		Data struct {
			Id string `json:"id"`
		} `json:"data"`
	}

	if err := json.Unmarshal(res, &apiResponse); err != nil {
		return "", err
	}

	if apiResponse.Code != 200 {
		return "", fmt.Errorf(apiResponse.Msg)
	}

	// 返回成功信息
	return t.formatResult(approvalType, data), nil
}

// formatResult 格式化创建结果
func (t *ApprovalTool) formatResult(approvalType int, data map[string]any) string {
	switch approvalType {
	case 2:
		return fmt.Sprintf("请假审批已创建成功！\n理由: %s", getString(data, "reason"))
	case 3:
		return fmt.Sprintf("补卡审批已创建成功！\n理由: %s", getString(data, "reason"))
	case 4:
		return fmt.Sprintf("外出审批已创建成功！\n理由: %s", getString(data, "reason"))
	default:
		return "审批已创建成功！"
	}
}

// getFloat64 安全获取float64值
func getFloat64(data map[string]any, key string) float64 {
	if v, ok := data[key]; ok {
		if f, ok := v.(float64); ok {
			return f
		}
	}
	return 0
}

// getString 安全获取string值
func getString(data map[string]any, key string) string {
	if v, ok := data[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// getLeaveTypeName 获取请假类型名称
func getLeaveTypeName(leaveType int) string {
	switch leaveType {
	case 1:
		return "事假"
	case 2:
		return "调休"
	case 3:
		return "病假"
	case 4:
		return "年假"
	case 5:
		return "产假"
	case 6:
		return "陪产假"
	case 7:
		return "婚假"
	case 8:
		return "丧假"
	case 9:
		return "哺乳假"
	default:
		return "请假"
	}
}
