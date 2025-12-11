package memoryx

import (
	"context"
	"sync"

	"aiOffice/pkg/langchain"

	"github.com/tmc/langchaingo/schema"
)

type Memoryx struct {
	sync.Mutex
	memorys       map[string]schema.Memory // chatId -> memory
	createMemory  func() schema.Memory
	defaultMemory schema.Memory // 默认内存实例，用于没有指定会话ID的情况
}

func NewMemoryx(createFunc func() schema.Memory) *Memoryx {
	return &Memoryx{
		memorys:       make(map[string]schema.Memory),
		createMemory:  createFunc,
		defaultMemory: createFunc(),
	}
}

func (m *Memoryx) GetMemory(chatId string) schema.Memory {
	m.Mutex.Lock()
	defer m.Mutex.Unlock()

	mem, ok := m.memorys[chatId]
	if !ok {
		// 不存在就创建新的
		mem = m.createMemory()
		m.memorys[chatId] = mem
	}
	return mem
}

// GetMemoryKey 获取当前会话的内存键名
func (s *Memoryx) GetMemoryKey(ctx context.Context) string {
	return s.memory(ctx).GetMemoryKey(ctx)
}

// MemoryVariables 获取当前会话内存动态加载的输入键列表
func (s *Memoryx) MemoryVariables(ctx context.Context) []string {
	return s.memory(ctx).MemoryVariables(ctx)
}

// LoadMemoryVariables 根据输入参数加载当前会话的内存变量，返回键值对映射
func (s *Memoryx) LoadMemoryVariables(ctx context.Context, inputs map[string]any) (map[string]any, error) {
	return s.memory(ctx).LoadMemoryVariables(ctx, inputs)
}

// SaveContext 将当前模型运行的上下文保存到对应会话的内存中
func (s *Memoryx) SaveContext(ctx context.Context, inputs map[string]any, outputs map[string]any) error {
	return s.memory(ctx).SaveContext(ctx, inputs, outputs)
}

// Clear 清空当前会话的内存内容
func (s *Memoryx) Clear(ctx context.Context) error {
	return s.memory(ctx).Clear(ctx)
}

// memory 根据上下文中的聊天ID获取对应的内存实例，如果不存在则创建新的
func (s *Memoryx) memory(ctx context.Context) schema.Memory {
	s.Lock() // 加锁保证并发安全
	defer s.Unlock()

	var chatId string
	v := ctx.Value(langchain.ChatId) // 从上下文中获取聊天会话ID
	if v == nil {
		return s.defaultMemory // 如果没有会话ID，返回默认内存实例
	}

	chatId = v.(string)
	memory, ok := s.memorys[chatId] // 查找该会话ID对应的内存实例
	if !ok {
		memory = s.GetMemory(chatId) // 如果不存在，创建新的内存实例
		s.memorys[chatId] = memory   // 将新实例存储到映射中
	}

	return memory
}
