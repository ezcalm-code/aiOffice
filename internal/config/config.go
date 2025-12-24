package config

import "gitee.com/dn-jinmin/tlog"

type Config struct {
	Name string
	Addr string

	MySql struct {
		DataSource string
	}

	Redis struct {
		Addr     string
		Password string
		DB       int
	}

	Asynq struct {
		Enabled     bool   `yaml:"Enabled"`     // 是否启用
		Concurrency int    `yaml:"Concurrency"` // Worker 并发数
		RetryMax    int    `yaml:"RetryMax"`    // 最大重试次数
		MonitorAddr string `yaml:"MonitorAddr"` // 监控面板地址
	}

	Mongo struct {
		User     string
		Password string
		Host     []string
		Port     int
		Database string
		Param    string
		//MaxPoolSize uint64
	}

	Jwt struct {
		Secret string
		Expire int64
	}

	Tlog struct {
		Mode  tlog.LogMod //运行模式
		Label string      //加载日志输出的标签
	}
	Ws struct {
		Addr string
	}
	LangChain struct {
		Url    string
		ApiKey string
	}
	Upload struct {
		SavePath string
		Host     string
	}
}
