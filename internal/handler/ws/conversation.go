package ws

import (
	"aiOffice/internal/domain"
	"context"

	"github.com/gorilla/websocket"
)

func (ws *Ws) privateChat(ctx context.Context, conn *websocket.Conn, req *domain.Message) error {
	if err := ws.chat.PrivateChat(ctx, req); err != nil {
		return err
	}
	return ws.SendByUids(ctx, req, req.RecvId)
}

func (ws *Ws) groupChat(ctx context.Context, conn *websocket.Conn, req *domain.Message) error {
	if _, err := ws.chat.GroupChat(ctx, req); err != nil {
		return err
	}
	return ws.SendByUids(ctx, req)
}
