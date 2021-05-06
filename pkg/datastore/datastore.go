package datastore

import "context"

type Config struct {
	URL      string
	Database string
}

type DataStore interface {
	Add(ctx context.Context, kind string, entity interface{}) error

	Put(ctx context.Context, kind, name string, entity interface{}) error

	Delete(ctx context.Context, kind, name string) error

	Get(ctx context.Context, kind, name string, decodeTo interface{}) error

	// Find executes a find command and returns an iterator over the matching items.
	Find(ctx context.Context, kind string) (Iterator, error)

	FindOne(ctx context.Context, kind, name string) (Iterator, error)

	IsExist(ctx context.Context, kind, name string) (bool, error)
}

type Iterator interface {
	// Next gets the next item for this cursor.
	Next(ctx context.Context) bool

	// Decode will unmarshal the current item into given entity.
	Decode(entity interface{}) error

	Close(ctx context.Context)
}
