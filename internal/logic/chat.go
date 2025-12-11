package logic

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"sort"
	"strings"

	"aiOffice/internal/domain"
	chatinternal "aiOffice/internal/logic/chatinternal/handler"
	"aiOffice/internal/model"
	"aiOffice/internal/svc"
	"aiOffice/pkg/langchain"
	langhandler "aiOffice/pkg/langchain/handler"
	"aiOffice/pkg/langchain/memoryx"
	"aiOffice/pkg/langchain/router"
	"aiOffice/pkg/timeutils"
	"aiOffice/pkg/token"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/memory"
	"github.com/tmc/langchaingo/schema"
)

type Chat interface {
	PrivateChat(ctx context.Context, req *domain.Message) error
	GroupChat(ctx context.Context, req *domain.Message) (uids []string, err error)
	AIChat(ctx context.Context, req *domain.ChatReq) (*domain.ChatResp, error)
}

type chat struct {
	svc    *svc.ServiceContext
	router *router.Router
	memory schema.Memory
}

func NewChat(svc *svc.ServiceContext) Chat {
	// 1.创建handler
	handlers := []langhandler.Handler{
		chatinternal.NewDefaultHandler(svc),
		chatinternal.NewTodoHandler(svc),
	}

	// 2.创建memory
	m := memoryx.NewMemoryx(func() schema.Memory {
		return memory.NewConversationBuffer()
	})

	// 3.创建router
	r := router.NewRouter(svc.LLM, handlers)

	return &chat{
		svc:    svc,
		memory: m,
		router: r,
	}
}

// PrivateChat 处理私聊消息，将消息保存到数据库
func (l *chat) PrivateChat(ctx context.Context, req *domain.Message) error {
	// 调用通用的聊天日志保存方法
	return l.chatlog(ctx, req)
}

// GroupChat 处理群聊消息，将消息保存到数据库
func (l *chat) GroupChat(ctx context.Context, req *domain.Message) (uids []string, err error) {
	// 保留前端传递的群聊conversationId，不再强制改为"all"
	// 这样每个群聊都有独立的conversationId，可以单独查询和总结
	// 注意：如果前端没有传conversationId，保持为空（会在chatlog中处理）
	// req.ConversationId = "all"
	// 保存群聊消息到数据库
	if err := l.chatlog(ctx, req); err != nil {
		return nil, err
	}

	// 返回空的用户ID列表（当前实现不需要返回特定用户列表）
	return nil, err
}

func (l *chat) AIChat(ctx context.Context, req *domain.ChatReq) (resp *domain.ChatResp, err error) {
	uid := token.GetUid(ctx)
	ctx = context.WithValue(ctx, langchain.ChatId, uid)

	// if req.ChatType > 0 {
	// 	return l.basicService(ctx, req)
	// }
	return l.aiService(ctx, req)
}

func (l *chat) aiService(ctx context.Context, req *domain.ChatReq) (output *domain.ChatResp, err error) {
	// 将chatlog相关参数通过context传递,避免影响memory的保存逻辑
	ctx = context.WithValue(ctx, "relationId", req.RelationId)
	// ctx = context.WithValue(ctx, "startTime", req.StartTime)
	// ctx = context.WithValue(ctx, "endTime", req.EndTime)
	v, err := chains.Call(ctx, l.router, map[string]any{
		langchain.Input: req.Prompts,
	}, chains.WithCallback(l.svc.Cb))
	if err != nil {
		// 特殊处理：如果是agent输出解析错误，尝试从错误消息中提取有用信息
		if strings.Contains(err.Error(), "unable to parse agent output") {
			// 提取错误消息中的实际内容，通常在冒号后面
			parts := strings.Split(err.Error(), ": ")
			if len(parts) > 1 {
				content := parts[len(parts)-1]
				// 返回提取到的内容
				return &domain.ChatResp{
					ChatType: domain.DefaultHandler,
					Data:     content,
				}, nil
			}
		}
		return nil, err
	}

	// 检查输出类型并处理非字符串输出
	var data string
	if _, ok := v[langchain.Output].(string); !ok {
		// 如果输出不是字符串，直接返回原始数据
		return &domain.ChatResp{
			ChatType: domain.DefaultHandler,
			Data:     v,
		}, nil
	}
	data = v[langchain.Output].(string)

	// 尝试解析AI输出为结构化响应格式: {"chatType": "", data: ""}
	var res domain.ChatResp
	if err := json.Unmarshal([]byte(data), &res); err != nil {
		// 解析失败时返回默认处理器类型和原始数据
		return &domain.ChatResp{
			ChatType: domain.DefaultHandler,
			Data:     data,
		}, nil
	}

	return &res, nil
}

// chatlog 通用的聊天消息保存方法，将消息记录到数据库
func (l *chat) chatlog(ctx context.Context, req *domain.Message) error {
	sendId := req.SendId

	// 构建聊天日志数据模型
	chatlog := model.ChatLog{
		ConversationId: req.ConversationId,           // 会话ID
		SendId:         sendId,                       // 发送者ID
		RecvId:         req.RecvId,                   // 接收者ID
		ChatType:       model.ChatType(req.ChatType), // 聊天类型（1=群聊，2=私聊）
		MsgContent:     req.Content,                  // 消息内容
		SendTime:       timeutils.Now(),              // 发送时间戳
	}

	// 如果没有指定会话ID，则为私聊生成唯一的会话ID
	if chatlog.ConversationId == "" {
		chatlog.ConversationId = GenerateUniqueID(sendId, req.RecvId)
	}

	// 将聊天记录保存到数据库
	return l.svc.ChatLogModel.Insert(ctx, &chatlog)
}

// GenerateUniqueID 根据传递的两个字符串 ID 生成唯一的 ID
func GenerateUniqueID(id1, id2 string) string {
	// 将两个 ID 放入切片中
	ids := []string{id1, id2}

	// 对 IDs 切片进行排序
	sort.Strings(ids)

	// 将排序后的 ID 组合起来
	combined := ids[0] + ids[1]

	// 创建 SHA-256 哈希对象
	hasher := sha256.New()

	// 写入合并后的字符串
	hasher.Write([]byte(combined))

	// 计算哈希值
	hash := hasher.Sum(nil)

	// 返回哈希值的十六进制字符串表示
	return base64.RawStdEncoding.EncodeToString(hash)[:22] // 可以选择更短的长度
}
