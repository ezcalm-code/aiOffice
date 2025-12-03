package svc

import (
	"aiOffice/internal/config"
)

type ServiceContext struct {
	Config config.Config

	// todo repo and pkg object instance
}

func NewServiceContext(c config.Config) (*ServiceContext, error) {

	return &ServiceContext{
		Config: c,
	}, nil
}
