package token

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt"
)

// jwt标准声明字段
const (
	jwtAudience   = "aud"           //受众
	jwtExpire     = "exp"           //过期时间
	jwtId         = "jti"           //jwt id
	jwtIssueAt    = "iat"           //签发时间
	jwtIssuer     = "iss"           //签发者
	jwtNotBefore  = "nbf"           //生效时间
	jwtSubject    = "sub"           //主题
	Authorization = "Authorization" //http 字段
)

// token解析相关错误定义
var (
	ErrTokenNotFind  = errors.New("token不存在")
	ErrTokenInvalid  = errors.New("token invalid")
	ErrClaimsInvalid = errors.New("invalid token claim")
)

//Parse jwt 解析

type Parse struct {
	AccessSecret string // jwt 签名密钥
}

func NewTokenParse(secret string) *Parse {
	return &Parse{AccessSecret: secret}
}

// 从http中解析出token
func (p *Parse) Parse(r *http.Request) (jwt.MapClaims, string, error) {
	tokenStr := p.ExtractTokenFromHeader(r)
	if len(tokenStr) == 0 {
		return nil, tokenStr, ErrTokenNotFind
	}
	return p.ParseToken(tokenStr)
}

func (p *Parse) ParseToken(tokenStr string) (jwt.MapClaims, string, error) {
	// 解析token
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(p.AccessSecret), nil
	})
	if err != nil {
		return nil, tokenStr, err
	}
	//验证token
	if !token.Valid {
		return nil, tokenStr, ErrTokenInvalid
	}
	//提取声明信息
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, tokenStr, ErrClaimsInvalid
	}
	//验证声明
	if err = claims.Valid(); err != nil {
		return nil, tokenStr, err
	}
	return claims, tokenStr, nil
}

func (p *Parse) ParseWithContext(r *http.Request) (*http.Request, error) {
	//解析token
	claims, tokenStr, err := p.Parse(r)
	if err != nil {
		return r, err
	}
	ctx := r.Context()
	for k, v := range claims {
		switch k {
		case jwtAudience, jwtExpire, jwtId, jwtIssueAt, jwtIssuer, jwtNotBefore, jwtSubject:
		default:
			ctx = context.WithValue(ctx, k, v)
		}
	}
	//保存原始token到上下文
	ctx = context.WithValue(ctx, Authorization, tokenStr)
	return r.WithContext(ctx), nil
}

func (p *Parse) ExtractTokenFromHeader(r *http.Request) string {
	authHeader := r.Header.Get(Authorization)
	if authHeader == "" {
		return ""
	}
	//Bearer <token>
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 && parts[0] != "Bearer" {
		return authHeader
	}
	return parts[1]
}

func GetTokenStr(ctx context.Context) string {
	tokenStr, ok := ctx.Value(Authorization).(string)
	if !ok {
		return ""
	}
	return tokenStr
}
