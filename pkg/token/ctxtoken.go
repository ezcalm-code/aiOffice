package token

import (
	"context"

	"github.com/golang-jwt/jwt"
)

const Identify = "wsj666"

func GetJwtToken(secretyKey string, iat, second int64, uid string) (string, error) {
	claims := make(jwt.MapClaims)
	claims["exp"] = iat + second //过期时间
	claims["iat"] = iat          //签发时间
	claims[Identify] = uid       //用户标识

	token := jwt.New(jwt.SigningMethodES256)
	token.Claims = claims
	return token.SignedString([]byte(secretyKey))
}

func GetUid(ctx context.Context) string {
	uid, ok := ctx.Value(Identify).(string)
	if !ok {
		return ""
	}
	return uid
}
