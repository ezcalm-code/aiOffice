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
}
