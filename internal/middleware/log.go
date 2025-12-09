package middleware

import (
	"fmt"
	"time"

	"gitee.com/dn-jinmin/tlog"
	"github.com/gin-gonic/gin"
)

type Log struct{}

func NewLog() *Log {
	return &Log{}
}

// 日志中间件处理函数 为每个http请求生成链路追踪
func (w *Log) Handler(ctx *gin.Context) {
	//请求开始时间
	startTime := time.Now()
	//构造请求标识 路径:方法
	url := fmt.Sprintf("%s:%s", ctx.Request.URL.Path, ctx.Request.Method)
	//启动链路
	ctx.Request = ctx.Request.WithContext(tlog.TraceStart(ctx.Request.Context()))
	defer func() {
		// 记录请求完成日志和响应时间
		tlog.InfoCtx(ctx.Request.Context(), url, "time", tlog.RTField(startTime, time.Now()))
	}()
	//继续执行后续中间件处理
	ctx.Next()
}
