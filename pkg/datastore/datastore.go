package datastore

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

type Config struct {
	User     string
	Password string
	Address  string
	DBName   string
}

type DataStore interface {
}

type mysqlStore struct {
	db *sql.DB
}

func New(cfg Config) (DataStore, error) {
	db, err := sql.Open("mysql",
		fmt.Sprintf("%s:%s@tcp(%s)/%s", cfg.User, cfg.Password, cfg.Address, cfg.DBName))
	if err != nil {
		return nil, err
	}

	s := mysqlStore{
		db: db,
	}
	return s, nil
}
