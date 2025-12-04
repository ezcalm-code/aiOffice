package config

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

	Mongo struct {
		User     string
		Password string
		Host     []string
		Port     int
		Database string
		Param    string
		//MaxPoolSize uint64
	}
}
