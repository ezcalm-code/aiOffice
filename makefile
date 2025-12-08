api:
	../goctl-gin/goctl-gin api go -api ./doc/start.api -dir ./

user:
	../goctl-gin/goctl-gin model mongo --type user --dir ./internal/model

department:
	../goctl-gin/goctl-gin model mongo --type department --dir ./internal/model
departmentuser:
	../goctl-gin/goctl-gin model mongo --type departmentuser --dir ./internal/model

todoRecord:
	../goctl-gin/goctl-gin model mongo --type todoRecord --dir ./internal/model
userTodo:
	../goctl-gin/goctl-gin model mongo --type userTodo --dir ./internal/model
todo:
	../goctl-gin/goctl-gin model mongo --type todo --dir ./internal/model

approval:
	../goctl-gin/goctl-gin model mongo --type approval --dir ./internal/model

chatLog:
	../goctl-gin/goctl-gin model mongo --type chatLog --dir ./internal/model

swagger:
	swag init

swagger-fmt:
	swag fmt