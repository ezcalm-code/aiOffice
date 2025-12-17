package chatinternal

import (
	"aiOffice/internal/logic/chatinternal/toolx"
	"aiOffice/internal/svc"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/tools"
)

type ApprovalHandler struct {
	*basechat
}

func NewApprovalHandler(svc *svc.ServiceContext) *ApprovalHandler {
	// 创建审批工具
	approvalTools := []tools.Tool{
		toolx.NewApprovalTool(svc),      // 创建审批
		toolx.NewApprovalQueryTool(svc), // 查询审批
	}

	return &ApprovalHandler{
		basechat: NewBaseChat(svc, approvalTools),
	}
}

func (t *ApprovalHandler) Name() string {
	return "approval"
}

func (t *ApprovalHandler) Description() string {
	return "suitable for approval processing, such as leave request, make-up card, go out, query approval records, etc"
}

func (t *ApprovalHandler) Chains() chains.Chain {
	return t.basechat.Chains()
}
