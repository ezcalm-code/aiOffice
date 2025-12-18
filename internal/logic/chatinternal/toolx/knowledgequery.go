package toolx

import (
	"context"
	"fmt"

	"aiOffice/internal/svc"

	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/vectorstores"
	"github.com/tmc/langchaingo/vectorstores/redisvector"
)

// KnowledgeQuery 知识库查询工具
type KnowledgeQuery struct {
	svc   *svc.ServiceContext
	store *redisvector.Store
	qa    chains.Chain
}

func NewKnowledgeQuery(svc *svc.ServiceContext) *KnowledgeQuery {
	return &KnowledgeQuery{svc: svc}
}

func (k *KnowledgeQuery) Name() string {
	return "knowledge_query"
}

func (k *KnowledgeQuery) Description() string {
	return `a knowledge retrieval interface.
use it when you need to inquire about work-related policies, such as employee manuals, attendance rules, approval process, leave matters, etc.
use when user asks: "公司制度", "员工手册", "考勤规则", "请假流程", "报销流程"
keep Chinese output.`
}

func (k *KnowledgeQuery) Call(ctx context.Context, input string) (string, error) {
	fmt.Printf("[KnowledgeQuery] 被调用，输入: %s\n", input)

	var err error
	if k.qa == nil {
		k.store, err = getKnowledgeStore(ctx, k.svc)
		if err != nil {
			return "", fmt.Errorf("获取向量存储失败: %v", err)
		}

		// 创建检索QA链
		k.qa = chains.NewRetrievalQAFromLLM(k.svc.LLM, vectorstores.ToRetriever(k.store, 3))
	}

	// 执行查询
	res, err := chains.Predict(ctx, k.qa, map[string]any{
		"query": input,
	})
	if err != nil {
		return "", fmt.Errorf("查询失败: %v", err)
	}

	return res, nil
}
