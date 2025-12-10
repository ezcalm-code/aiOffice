package handler

import "github.com/tmc/langchaingo/chains"

type Handler interface {
	Name() string         // 处理器名称，用于路由识别
	Description() string  // 描述，让LLM理解这个处理器干什么
	Chains() chains.Chain // 返回实际处理的Chain
}
