package logic

import (
	"context"
	"fmt"

	"aiOffice/internal/domain"
	"aiOffice/internal/model"
	"aiOffice/internal/svc"
	"aiOffice/pkg/timeutils"
	"aiOffice/pkg/xerr"
)

var (
	ErrApprovalNotFound = fmt.Errorf("审批不存在")
)

type Approval interface {
	Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.ApprovalInfoResp, err error)
	Create(ctx context.Context, req *domain.Approval) (resp *domain.IdResp, err error)
	Dispose(ctx context.Context, req *domain.DisposeReq) (err error)
	List(ctx context.Context, req *domain.ApprovalListReq) (resp *domain.ApprovalListResp, err error)
}

type approval struct {
	svcCtx *svc.ServiceContext
}

func NewApproval(svcCtx *svc.ServiceContext) Approval {
	return &approval{
		svcCtx: svcCtx,
	}
}

// Info 获取审批详情
func (l *approval) Info(ctx context.Context, req *domain.IdPathReq) (resp *domain.ApprovalInfoResp, err error) {
	approvalData, err := l.svcCtx.ApprovalModel.FindOne(ctx, req.Id)
	if err != nil {
		if err == model.ErrNotFound {
			return nil, ErrApprovalNotFound
		}
		return nil, xerr.WithMessage(err, "查询审批失败")
	}

	// 使用model中的转换方法
	resp = approvalData.ToDomainApprovalInfo()

	// 获取申请人信息
	user, err := l.svcCtx.UserModel.FindOne(ctx, approvalData.UserId)
	if err == nil {
		resp.User = &domain.Approver{
			UserId:   user.ID.Hex(),
			UserName: user.Name,
		}
	}

	// 转换审批人列表
	for _, a := range approvalData.Approvers {
		resp.Approvers = append(resp.Approvers, &domain.Approver{
			UserId:   a.UserId,
			UserName: a.UserName,
			Status:   int(a.Status),
			Reason:   a.Reason,
		})
	}

	// 转换抄送人列表
	for _, c := range approvalData.CopyPersons {
		resp.CopyPersons = append(resp.CopyPersons, &domain.Approver{
			UserId:   c.UserId,
			UserName: c.UserName,
			Status:   int(c.Status),
		})
	}

	// 设置当前审批人
	if approvalData.ApprovalIdx < len(approvalData.Approvers) {
		currentApprover := approvalData.Approvers[approvalData.ApprovalIdx]
		resp.Approver = &domain.Approver{
			UserId:   currentApprover.UserId,
			UserName: currentApprover.UserName,
			Status:   int(currentApprover.Status),
			Reason:   currentApprover.Reason,
		}
	}

	return resp, nil
}

// Create 创建审批
func (l *approval) Create(ctx context.Context, req *domain.Approval) (resp *domain.IdResp, err error) {
	// 生成审批编号
	no := fmt.Sprintf("SP%d", timeutils.Now())

	approvalData := &model.Approval{
		UserId:   req.UserId,
		No:       no,
		Type:     model.ApprovalType(req.Type),
		Status:   model.Processed, // 初始状态：处理中
		Title:    req.Title,
		Abstract: req.Abstract,
		Reason:   req.Reason,
	}

	// 根据审批类型设置详情
	switch model.ApprovalType(req.Type) {
	case model.LeaveApproval:
		if req.Leave != nil {
			approvalData.Leave = &model.Leave{
				Type:      model.LeaveType(req.Leave.Type),
				StartTime: req.Leave.StartTime,
				EndTime:   req.Leave.EndTime,
				Reason:    req.Leave.Reason,
				TimeType:  model.TimeFormatType(req.Leave.TimeType),
			}
			approvalData.Title = model.LeaveType(req.Leave.Type).ToString()
		}
	case model.MakeCardApproval:
		if req.MakeCard != nil {
			approvalData.MakeCard = &model.MakeCard{
				Date:      req.MakeCard.Date,
				Reason:    req.MakeCard.Reason,
				Day:       req.MakeCard.Day,
				CheckType: model.WorkCheckType(req.MakeCard.CheckType),
			}
			approvalData.Title = model.ApprovalType(req.Type).ToString()
		}
	case model.GoOutApproval:
		if req.GoOut != nil {
			approvalData.GoOut = &model.GoOut{
				StartTime: req.GoOut.StartTime,
				EndTime:   req.GoOut.EndTime,
				Duration:  req.GoOut.Duration,
				Reason:    req.GoOut.Reason,
			}
			approvalData.Title = model.ApprovalType(req.Type).ToString()
		}
	default:
		approvalData.Title = model.ApprovalType(req.Type).ToString()
	}

	err = l.svcCtx.ApprovalModel.Insert(ctx, approvalData)
	if err != nil {
		return nil, xerr.WithMessage(err, "创建审批失败")
	}

	return &domain.IdResp{Id: approvalData.ID.Hex()}, nil
}

// Dispose 处理审批（通过/拒绝）
func (l *approval) Dispose(ctx context.Context, req *domain.DisposeReq) (err error) {
	approvalData, err := l.svcCtx.ApprovalModel.FindOne(ctx, req.ApprovalId)
	if err != nil {
		if err == model.ErrNotFound {
			return ErrApprovalNotFound
		}
		return xerr.WithMessage(err, "查询审批失败")
	}

	// 检查审批状态是否为处理中
	if approvalData.Status != model.Processed {
		return xerr.New(fmt.Errorf("审批已处理"))
	}

	// 更新当前审批人的状态
	if approvalData.ApprovalIdx < len(approvalData.Approvers) {
		approvalData.Approvers[approvalData.ApprovalIdx].Status = model.ApprovalStatus(req.Status)
		approvalData.Approvers[approvalData.ApprovalIdx].Reason = req.Reason
	}

	// 根据处理结果更新审批状态
	switch model.ApprovalStatus(req.Status) {
	case model.Pass:
		// 检查是否还有下一个审批人
		if approvalData.ApprovalIdx+1 < len(approvalData.Approvers) {
			// 移动到下一个审批人
			approvalData.ApprovalIdx++
			approvalData.ApprovalId = approvalData.Approvers[approvalData.ApprovalIdx].UserId
		} else {
			// 所有审批人都通过，审批完成
			approvalData.Status = model.Pass
			approvalData.FinishAt, approvalData.FinishDay, approvalData.FinishMonth, approvalData.FinishYeas = timeutils.FinishTime()
		}
	case model.Refuse:
		// 拒绝，审批结束
		approvalData.Status = model.Refuse
		approvalData.FinishAt, approvalData.FinishDay, approvalData.FinishMonth, approvalData.FinishYeas = timeutils.FinishTime()
	}

	err = l.svcCtx.ApprovalModel.Update(ctx, approvalData)
	if err != nil {
		return xerr.WithMessage(err, "更新审批失败")
	}

	return nil
}

// List 审批列表
func (l *approval) List(ctx context.Context, req *domain.ApprovalListReq) (resp *domain.ApprovalListResp, err error) {
	approvals, total, err := l.svcCtx.ApprovalModel.List(ctx, req.UserId, req.Type, req.Page, req.Count)
	if err != nil {
		return nil, xerr.WithMessage(err, "查询审批列表失败")
	}

	resp = &domain.ApprovalListResp{
		Count: total,
		List:  make([]*domain.ApprovalList, 0, len(approvals)),
	}

	for _, a := range approvals {
		resp.List = append(resp.List, a.ToDomainApprovalList())
	}

	return resp, nil
}
