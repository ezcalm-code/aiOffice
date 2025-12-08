package ws

import (
	"aiOffice/internal/svc"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

type Ws struct {
	websocket.Upgrader
	svc *svc.ServiceContext
}

func NewWs(svc svc.ServiceContext) *Ws {
	return &Ws{
		svc: &svc,
	}
}

func (ws *Ws) ServeWs(w http.ResponseWriter, r *http.Request) {

}

func (ws *Ws) Run() {
	http.HandleFunc("/ws", ws.ServeWs)
	fmt.Println("ws服务正在运行在", ws.svc.Config.Ws.Addr)
	http.ListenAndServe(ws.svc.Config.Ws.Addr, nil)
}
