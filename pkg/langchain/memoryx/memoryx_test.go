package memoryx

import (
	"context"
	"testing"

	"github.com/tmc/langchaingo/memory"
	"github.com/tmc/langchaingo/schema"
)

func TestMemoryxLRU(t *testing.T) {
	// 创建最大容量为3的LRU缓存
	m := NewMemoryx(func() schema.Memory {
		return memory.NewConversationBuffer()
	}, WithMaxSize(3))

	// 添加3个会话
	m.GetMemory("chat1")
	m.GetMemory("chat2")
	m.GetMemory("chat3")

	if m.Size() != 3 {
		t.Errorf("expected size 3, got %d", m.Size())
	}

	// 添加第4个会话，应该淘汰chat1（最久未使用）
	m.GetMemory("chat4")

	if m.Size() != 3 {
		t.Errorf("expected size 3 after eviction, got %d", m.Size())
	}

	// 验证chat1被淘汰
	m.Lock()
	_, exists := m.memorys["chat1"]
	m.Unlock()

	if exists {
		t.Error("chat1 should have been evicted")
	}

	// 验证chat2, chat3, chat4存在
	for _, id := range []string{"chat2", "chat3", "chat4"} {
		m.Lock()
		_, exists := m.memorys[id]
		m.Unlock()
		if !exists {
			t.Errorf("%s should exist", id)
		}
	}
}

func TestMemoryxLRUOrder(t *testing.T) {
	m := NewMemoryx(func() schema.Memory {
		return memory.NewConversationBuffer()
	}, WithMaxSize(3))

	// 添加3个会话
	m.GetMemory("chat1")
	m.GetMemory("chat2")
	m.GetMemory("chat3")

	// 访问chat1，使其变为最近使用
	m.GetMemory("chat1")

	// 添加chat4，应该淘汰chat2（现在是最久未使用）
	m.GetMemory("chat4")

	m.Lock()
	_, chat1Exists := m.memorys["chat1"]
	_, chat2Exists := m.memorys["chat2"]
	m.Unlock()

	if !chat1Exists {
		t.Error("chat1 should exist (was recently accessed)")
	}
	if chat2Exists {
		t.Error("chat2 should have been evicted")
	}
}

func TestMemoryxRemove(t *testing.T) {
	m := NewMemoryx(func() schema.Memory {
		return memory.NewConversationBuffer()
	})

	m.GetMemory("chat1")
	m.GetMemory("chat2")

	if m.Size() != 2 {
		t.Errorf("expected size 2, got %d", m.Size())
	}

	m.Remove("chat1")

	if m.Size() != 1 {
		t.Errorf("expected size 1 after remove, got %d", m.Size())
	}

	m.Lock()
	_, exists := m.memorys["chat1"]
	m.Unlock()

	if exists {
		t.Error("chat1 should have been removed")
	}
}

func TestMemoryxContextAccess(t *testing.T) {
	m := NewMemoryx(func() schema.Memory {
		return memory.NewConversationBuffer()
	}, WithMaxSize(2))

	// 模拟通过context访问
	ctx := context.Background()

	// 没有chatId时应该返回defaultMemory
	mem1 := m.memory(ctx)
	if mem1 != m.defaultMemory {
		t.Error("should return default memory when no chatId in context")
	}

	// 验证defaultMemory不计入LRU
	if m.Size() != 0 {
		t.Errorf("default memory should not be counted, got size %d", m.Size())
	}
}
