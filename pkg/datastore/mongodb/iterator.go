package mongodb

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/oam-dev/velacp/pkg/datastore"
)

var _ datastore.Iterator = &Iterator{}

type Iterator struct {
	cur *mongo.Cursor
}

func (i *Iterator) Close(ctx context.Context) {
	i.cur.Close(ctx)
}

func (i *Iterator) Next(ctx context.Context) bool {
	return i.cur.Next(ctx)
}

func (i *Iterator) Decode(entity interface{}) error {
	return i.cur.Decode(entity)
}
