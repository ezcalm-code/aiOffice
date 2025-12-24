package memoryx

import (
	"container/list"
	"context"
	"sync"

	"aiOffice/pkg/langchain"

	"github.com/tmc/langchaingo/schema"
)

// lruEntry LRU缓存条目
type lruEntry struct {
	chatId string
	memory schema.Memory
}

type Memoryx struct {
	sync.Mutex
	memorys       map[string]*list.Element // chatId -> list.Element
	lruList       *list.List               // LRU双向链表，最近使用的在前面
	maxSize       int                      // 最大会话数量
	createMemory  func() schema.Memory
	defaultMemory schema.Memory
}

// Option 配置选项
type MemoryxOption func(*Memoryx)

// WithMaxSize 设置最大会话数量
func WithMaxSize(size int) MemoryxOption {
	return func(m *Memoryx) {
		if size > 0 {
			m.maxSize = size
		}
	}
}

func NewMemoryx(createFunc func() schema.Memory, opts ...MemoryxOption) *Memoryx {
	m := &Memoryx{
		memorys:       make(map[string]*list.Element),
		lruList:       list.New(),
		maxSize:       100, // 默认最多100个会话
		createMemory:  createFunc,
		defaultMemory: createFunc(),
	}

	for _, opt := range opts {
		opt(m)
	}

	return m
}

// GetMemory 获取指定会话的内存，会更新LRU顺序
func (m *Memoryx) GetMemory(chatId string) schema.Memory {
	m.Lock()
	defer m.Unlock()

	return m.getOrCreate(chatId)
}

// getOrCreate 获取或创建会话内存（内部方法，需要在锁内调用）
func (m *Memoryx) getOrCreate(chatId string) schema.Memory {
	if elem, ok := m.memorys[chatId]; ok {
		// 存在则移到链表头部（最近使用）
		m.lruList.MoveToFront(elem)
		return elem.Value.(*lruEntry).memory
	}

	// 不存在则创建新的
	mem := m.createMemory()
	entry := &lruEntry{chatId: chatId, memory: mem}
	elem := m.lruList.PushFront(entry)
	m.memorys[chatId] = elem

	// 检查是否超过最大容量，淘汰最久未使用的
	m.evictIfNeeded()

	return mem
}

// evictIfNeeded 如果超过容量则淘汰最久未使用的会话
func (m *Memoryx) evictIfNeeded() {
	for m.lruList.Len() > m.maxSize {
		// 移除链表尾部（最久未使用）
		oldest := m.lruList.Back()
		if oldest == nil {
			break
		}
		entry := oldest.Value.(*lruEntry)
		delete(m.memorys, entry.chatId)
		m.lruList.Remove(oldest)
	}
}

// GetMemoryKey 获取当前会话的内存键名
func (s *Memoryx) GetMemoryKey(ctx context.Context) string {
	return s.memory(ctx).GetMemoryKey(ctx)
}

// MemoryVariables 获取当前会话内存动态加载的输入键列表
func (s *Memoryx) MemoryVariables(ctx context.Context) []string {
	return s.memory(ctx).MemoryVariables(ctx)
}

// LoadMemoryVariables 根据输入参数加载当前会话的内存变量
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

// memory 根据上下文中的聊天ID获取对应的内存实例
func (s *Memoryx) memory(ctx context.Context) schema.Memory {
	s.Lock()
	defer s.Unlock()

	v := ctx.Value(langchain.ChatId)
	if v == nil {
		return s.defaultMemory
	}

	chatId := v.(string)
	return s.getOrCreate(chatId)
}

// Size 返回当前会话数量
func (m *Memoryx) Size() int {
	m.Lock()
	defer m.Unlock()
	return m.lruList.Len()
}

// Remove 手动移除指定会话
func (m *Memoryx) Remove(chatId string) {
	m.Lock()
	defer m.Unlock()

	if elem, ok := m.memorys[chatId]; ok {
		delete(m.memorys, chatId)
		m.lruList.Remove(elem)
	}
}
