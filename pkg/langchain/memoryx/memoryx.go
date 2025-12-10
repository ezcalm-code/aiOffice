package memoryx

import (
	"sync"

	"github.com/tmc/langchaingo/schema"
)

type Memoryx struct {
	sync.Mutex
	memorys      map[string]schema.Memory // chatId -> memory
	createMemory func() schema.Memory
}

func NewMemoryx(createFunc func() schema.Memory) *Memoryx {
	return &Memoryx{
		memorys:      make(map[string]schema.Memory),
		createMemory: createFunc,
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
