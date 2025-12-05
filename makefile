api:
	../goctl-gin/goctl-gin api go -api ./doc/start.api -dir ./

user:
	../goctl-gin/goctl-gin model mongo --type user --dir ./internal/model

department:
	../goctl-gin/goctl-gin model mongo --type department --dir ./internal/model
departmentuser:
	../goctl-gin/goctl-gin model mongo --type departmentuser --dir ./internal/model

swagger:
	swag init

swagger-fmt:
	swag fmt