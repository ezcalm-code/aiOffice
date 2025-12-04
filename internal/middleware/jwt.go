package middleware

import (
	"aiOffice/pkg/httpx"
	"aiOffice/pkg/token"

	"github.com/gin-gonic/gin"
)

type Jwt struct {
	tokenParse *token.Parse
}

func NewJwt(secrety string) *Jwt {
	return &Jwt{
		tokenParse: token.NewTokenParse(secrety),
	}
}

func (m *Jwt) Handler(ctx *gin.Context) {
	r, err := m.tokenParse.ParseWithContext(ctx.Request)
	if err != nil {
		httpx.FailWithErr(ctx, err)
		ctx.Abort()
		return
	}
	ctx.Request = r
	ctx.Next()
}
