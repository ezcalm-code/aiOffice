# AIOffice - 智能办公助手

基于 Go + LangChain 的企业级 AI 办公系统，支持智能对话、待办管理、审批流程、知识库问答等功能，你还可以快速的进行业务扩展，仅实现handler和业务功能来支持热插拔。(如果您希望的不是一个办公助手,而是xx助手，您可以删除待办、审批等功能，热插拔入您需要的业务逻辑。
)
## 功能特性

- **AI 智能对话** - 基于阿里云 DashScope 大模型，支持多轮对话
- **待办管理** - 创建、查询、完成待办事项
- **审批流程** - 请假、补卡、外出等审批申请与查询
- **知识库问答** - 上传文档自动入库，支持智能检索问答
- **即时通讯** - WebSocket 实现的群聊/私聊功能

## 技术栈

- Go 1.21+
- Gin (Web 框架)
- LangChain-Go (AI 框架)
- MongoDB (数据存储)
- Redis (向量存储)
- WebSocket (实时通讯)

## 快速开始

### 1. 环境准备

```bash
# 安装 MongoDB
# 安装 Redis
# 安装 Go 1.21+
```

### 2. 配置文件

编辑 `etc/local/config.yaml`：

```yaml
# MongoDB 配置
Mongo:
  Host: ["127.0.0.1"]
  Port: 27017
  Database: "aioffice"

# Redis 配置
Redis:
  Addr: "127.0.0.1:6379"

# 阿里云 DashScope API
LangChain:
  Url: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  ApiKey: "your-api-key"
```

### 3. 运行

```bash
# 编译
go build -o aiOffice.exe .

# 运行
./aiOffice.exe
```

服务启动后：
- HTTP API: `http://localhost:8001`
- WebSocket: `ws://localhost:9001`

## API 接口

### 用户认证
- `POST /v1/user/login` - 登录
- `POST /v1/user/register` - 注册

### AI 对话
- `POST /v1/chat/ai` - AI 智能对话

### 待办管理
- `POST /v1/todo/add` - 创建待办
- `GET /v1/todo/list` - 查询待办

### 审批流程
- `POST /v1/approval/add` - 发起审批
- `GET /v1/approval/list` - 查询审批

### 文件上传
- `POST /v1/upload/file` - 上传文件
- `POST /v1/upload/file?knowledge=1` - 上传并入知识库

## 知识库

支持的文件格式：`.md`、`.docx`、`.txt`

上传文件时带 `knowledge=1` 参数自动入库，之后可通过 AI 对话查询相关内容。

## 默认账号

- 用户名：`root`
- 密码：`root@123`

## 目录结构

```
├── internal/
│   ├── config/      # 配置
│   ├── handler/     # HTTP 处理器
│   ├── logic/       # 业务逻辑
│   ├── model/       # 数据模型
│   └── svc/         # 服务上下文
├── pkg/
│   ├── knowledge/   # 知识库处理
│   ├── langchain/   # LangChain 封装
│   └── ...
├── etc/             # 配置文件
└── main.go
```

## License

MIT
