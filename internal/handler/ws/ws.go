package ws

import (
	"aiOffice/internal/svc"
	"aiOffice/pkg/token"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"gitee.com/dn-jinmin/tlog"
	"github.com/gorilla/websocket"
)

type Ws struct {
	websocket.Upgrader
	svc       *svc.ServiceContext
	uidToConn map[string]*websocket.Conn
	connToUid map[*websocket.Conn]string

	sync.RWMutex
	tokenparse *token.Parse
}

func NewWs(svc svc.ServiceContext) *Ws {
	return &Ws{
		svc: &svc,
	}
}

func (ws *Ws) ServeWs(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if e := recover(); e != nil {
			tlog.ErrorCtx(r.Context(), "serverWs", e)
		}
	}()
	// 鉴权
	uid, token, err := ws.auth(r)
	if err := recover(); err != nil {
		tlog.ErrorfCtx(r.Context(), "serverWs", "auth fail %v", err)
		return
	}
	respHeader := http.Header{
		"websocket": []string{token},
	}
	conn, err := ws.Upgrade(w, r, respHeader)
	if err != nil {
		tlog.ErrorfCtx(r.Context(), "serverWs", "ugrade fail %v", err)
		return
	}
	ws.addConn(conn, uid)
	go ws.HandleConn(c, uid, token)
}

func (ws *Ws) HandleConn(conn *websocket.Conn, uid string, token string) {
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			tlog.Errorf("serverWs", "conn.ReadMessage fail %v, uid:%v", err.Error(), uid)
			ws.closeConn(conn)
			return
		}
	}
}

func (ws *Ws) Run() {
	http.HandleFunc("/ws", ws.ServeWs)
	fmt.Println("ws服务正在运行在", ws.svc.Config.Ws.Addr)
	http.ListenAndServe(ws.svc.Config.Ws.Addr, nil)
}

func (ws *Ws) addConn(conn *websocket.Conn, uid string) {
	ws.RWMutex.Lock()
	defer ws.RWMutex.Unlock()

	if conn := ws.uidToConn[uid]; conn != nil {
		conn.Close()
	}
	ws.connToUid[conn] = uid
	ws.uidToConn[uid] = conn
}

func (ws *Ws) closeConn(conn *websocket.Conn) {
	ws.RWMutex.Lock()
	defer ws.RWMutex.Unlock()

	uid := ws.connToUid[conn]
	if uid == "" {
		return
	}
	fmt.Printf("关闭%s连接\n", uid)
	delete(ws.connToUid, conn)
	delete(ws.uidToConn, uid)
	conn.Close()
}

func (ws *Ws) SendByConn(ctx context.Context, conn *websocket.Conn, v interface{}) error {
	buff, err := json.Marshal(v)
	if err != nil {
		tlog.ErrorCtx(ctx, "conn.send", err.Error())
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, buff)
}

func (ws *Ws) SendByUids(ctx context.Context, msg interface{}, uids ...string) error {
	ws.RWMutex.Lock()
	defer ws.RWMutex.Unlock()

	if len(uids) == 0 {
		for i, _ := range ws.uidToConn {
			if err := ws.SendByConn(ctx, ws.uidToConn[i]); err != nil {
				tlog.ErrorCtx(ctx, "ws.sendByUids", err.Error())
				return err
			}
		}
	}
	for _, uid := range uids {
		conn, ok := ws.uidToConn[uid]
		if !ok {
			continue
		}
		if err := ws.SendByConn(ctx, conn, msg); err != nil {
			tlog.ErrorfCtx(ctx, "sendByUids.err:%v, uid:%v", err.Error(), uid)
			return err
		}
	}
	return nil
}

func (ws *Ws) auth(r *http.Request) (uid string, tokenStr string, err error) {
	tok := r.Header.Get("sec-websocket-protocol")
	if tok == "" {
		return "", "", errors.New("未登录")
	}
	claim, tokenStr, err := ws.tokenparse.ParseToken(tok)
	if err != nil {
		return "", "", err
	}
	return claim[token.Identify].(string), tokenStr, nil
}
