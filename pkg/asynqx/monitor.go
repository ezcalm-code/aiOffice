package asynqx

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/hibiken/asynq"
)

// Monitor Asynq 监控面板（API 模式）
type Monitor struct {
	inspector *asynq.Inspector
	addr      string
	enabled   bool
	isRunning bool
}

// NewMonitor 创建监控面板
func NewMonitor(redisAddr, password string, db int, monitorAddr string, enabled bool) *Monitor {
	if !enabled || monitorAddr == "" {
		return &Monitor{enabled: false}
	}

	inspector := asynq.NewInspector(asynq.RedisClientOpt{
		Addr:     redisAddr,
		Password: password,
		DB:       db,
	})

	return &Monitor{
		inspector: inspector,
		addr:      monitorAddr,
		enabled:   true,
	}
}

// IsEnabled 是否启用
func (m *Monitor) IsEnabled() bool {
	return m.enabled
}

// QueueInfo 队列信息
type QueueInfo struct {
	Name      string `json:"name"`
	Size      int    `json:"size"`
	Pending   int    `json:"pending"`
	Active    int    `json:"active"`
	Scheduled int    `json:"scheduled"`
	Retry     int    `json:"retry"`
	Archived  int    `json:"archived"`
	Completed int    `json:"completed"`
}

// ServerInfo 服务器信息
type ServerInfo struct {
	ID          string    `json:"id"`
	Host        string    `json:"host"`
	PID         int       `json:"pid"`
	Concurrency int       `json:"concurrency"`
	Queues      []string  `json:"queues"`
	StartedAt   time.Time `json:"started_at"`
	Status      string    `json:"status"`
}

// Run 启动监控 API（阻塞）
func (m *Monitor) Run() error {
	if !m.enabled {
		fmt.Println("[AsynqMon] Monitor is disabled, skip starting")
		return nil
	}

	mux := http.NewServeMux()

	// 队列列表
	mux.HandleFunc("/api/queues", m.handleQueues)
	// 服务器列表
	mux.HandleFunc("/api/servers", m.handleServers)
	// 健康检查
	mux.HandleFunc("/health", m.handleHealth)
	// 简单的 HTML 页面
	mux.HandleFunc("/", m.handleIndex)

	m.isRunning = true
	fmt.Printf("[AsynqMon] Monitor API starting at http://%s\n", m.addr)
	return http.ListenAndServe(m.addr, mux)
}

func (m *Monitor) handleQueues(w http.ResponseWriter, r *http.Request) {
	queues, err := m.inspector.Queues()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var result []QueueInfo
	for _, q := range queues {
		info, err := m.inspector.GetQueueInfo(q)
		if err != nil {
			continue
		}
		result = append(result, QueueInfo{
			Name:      info.Queue,
			Size:      info.Size,
			Pending:   info.Pending,
			Active:    info.Active,
			Scheduled: info.Scheduled,
			Retry:     info.Retry,
			Archived:  info.Archived,
			Completed: info.Completed,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (m *Monitor) handleServers(w http.ResponseWriter, r *http.Request) {
	servers, err := m.inspector.Servers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var result []ServerInfo
	for _, s := range servers {
		var queueNames []string
		for q := range s.Queues {
			queueNames = append(queueNames, q)
		}
		result = append(result, ServerInfo{
			ID:          s.ID,
			Host:        s.Host,
			PID:         s.PID,
			Concurrency: s.Concurrency,
			Queues:      queueNames,
			StartedAt:   s.Started,
			Status:      s.Status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (m *Monitor) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (m *Monitor) handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	html := `<!DOCTYPE html>
<html>
<head>
    <title>Asynq Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        h1 { color: #333; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .refresh { color: #666; font-size: 12px; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .badge-pending { background: #ffc107; }
        .badge-active { background: #28a745; color: white; }
        .badge-retry { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <h1>🚀 Asynq Monitor</h1>
    
    <div class="card">
        <h2>Queues</h2>
        <table id="queues">
            <thead>
                <tr>
                    <th>Queue</th>
                    <th>Pending</th>
                    <th>Active</th>
                    <th>Scheduled</th>
                    <th>Retry</th>
                    <th>Completed</th>
                    <th>Archived</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <div class="card">
        <h2>Servers</h2>
        <table id="servers">
            <thead>
                <tr>
                    <th>Host</th>
                    <th>PID</th>
                    <th>Concurrency</th>
                    <th>Queues</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <p class="refresh">Auto refresh every 5 seconds</p>
    
    <script>
        async function fetchData() {
            try {
                const [queuesRes, serversRes] = await Promise.all([
                    fetch('/api/queues'),
                    fetch('/api/servers')
                ]);
                const queues = await queuesRes.json();
                const servers = await serversRes.json();
                
                // Render queues
                const queuesTbody = document.querySelector('#queues tbody');
                queuesTbody.innerHTML = (queues || []).map(q => ` + "`" + `
                    <tr>
                        <td><strong>${q.name}</strong></td>
                        <td><span class="badge badge-pending">${q.pending}</span></td>
                        <td><span class="badge badge-active">${q.active}</span></td>
                        <td>${q.scheduled}</td>
                        <td><span class="badge badge-retry">${q.retry}</span></td>
                        <td>${q.completed}</td>
                        <td>${q.archived}</td>
                    </tr>
                ` + "`" + `).join('') || '<tr><td colspan="7">No queues</td></tr>';
                
                // Render servers
                const serversTbody = document.querySelector('#servers tbody');
                serversTbody.innerHTML = (servers || []).map(s => ` + "`" + `
                    <tr>
                        <td>${s.host}</td>
                        <td>${s.pid}</td>
                        <td>${s.concurrency}</td>
                        <td>${(s.queues || []).join(', ')}</td>
                        <td>${s.status}</td>
                    </tr>
                ` + "`" + `).join('') || '<tr><td colspan="5">No servers running</td></tr>';
            } catch (e) {
                console.error('Failed to fetch data:', e);
            }
        }
        
        fetchData();
        setInterval(fetchData, 5000);
    </script>
</body>
</html>`
	w.Write([]byte(html))
}

// Handler 返回 HTTP Handler（用于集成到现有路由）
func (m *Monitor) Handler() http.Handler {
	if !m.enabled {
		return http.NotFoundHandler()
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/queues", m.handleQueues)
	mux.HandleFunc("/api/servers", m.handleServers)
	mux.HandleFunc("/health", m.handleHealth)
	mux.HandleFunc("/", m.handleIndex)
	return mux
}
