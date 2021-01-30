package datastore

import "context"

type Config struct {
	User     string
	Password string
	Address  string
	Database string
}

type DataStore interface {
	Put(ctx context.Context, kind string, entity interface{}) error

	// Find executes a find commandand returns an iterator over the matching items.
	Find(ctx context.Context, kind string) (Iterator, error)
}

type Iterator interface {
	// Next gets the next item for this cursor.
	Next(ctx context.Context) bool

	// Decode will unmarshal the current item into given entity.
	Decode(entity interface{}) error

	Close(ctx context.Context)
}
