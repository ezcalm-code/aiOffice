package start

import (
	"github.com/gin-gonic/gin"

	"aiOffice/internal/logic"
	"aiOffice/internal/svc"
	"aiOffice/pkg/httpx"
)

type Upload struct {
	svcCtx *svc.ServiceContext
	chat   logic.Chat
}

func NewUpload(svcCtx *svc.ServiceContext, chat logic.Chat) *Upload {
	return &Upload{
		svcCtx: svcCtx,
		chat:   chat,
	}
}

func (h *Upload) InitRegister(engine *gin.Engine) {
	g := engine.Group("v1/upload", h.svcCtx.Jwt.Handler)
	g.POST("/file", h.File)
	g.POST("/multiplefiles", h.Multiplefiles)
}

func (h *Upload) File(ctx *gin.Context) {
	res, err := h.chat.File(ctx.Request.Context())
	if err != nil {
		httpx.FailWithErr(ctx, err)
	} else {
		httpx.OkWithData(ctx, res)
	}
}

func (h *Upload) Multiplefiles(ctx *gin.Context) {
}
