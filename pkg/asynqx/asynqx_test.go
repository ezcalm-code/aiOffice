package asynqx

import (
	"testing"
)

func TestClient_Disabled(t *testing.T) {
	client := NewClient("localhost:6379", "", 0, false)

	if client.IsEnabled() {
		t.Error("client should be disabled")
	}
}

func TestClient_Enabled(t *testing.T) {
	client := NewClient("localhost:6379", "", 0, true)
	defer client.Close()

	if !client.IsEnabled() {
		t.Error("client should be enabled")
	}
}

func TestServer_Disabled(t *testing.T) {
	server := NewServer("localhost:6379", "", 0, 10, false)

	if server.IsEnabled() {
		t.Error("server should be disabled")
	}
}

func TestScheduler_Disabled(t *testing.T) {
	scheduler := NewScheduler("localhost:6379", "", 0, false)

	if scheduler.IsEnabled() {
		t.Error("scheduler should be disabled")
	}
}
