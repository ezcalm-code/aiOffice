package middleware

import "github.com/gin-gonic/gin"

type Jwt struct{}

func NewJwt() *Jwt {
	return &Jwt{}
}

func (m *Jwt) Handler(ctx *gin.Context) {
	ctx.Next()
}
