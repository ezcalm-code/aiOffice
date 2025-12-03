api:
	../goctl-gin/goctl-gin api go -api ./doc/start.api -dir .
mongo:
	../goctl-gin/goctl-gin model mongo --type user --dir ./internal/model