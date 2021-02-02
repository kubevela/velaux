package mongodb

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/oam-dev/velacp/pkg/datastore"
)

var _ datastore.DataStore = &mongodb{}

type mongodb struct {
	client   *mongo.Client
	database string
}

func New(ctx context.Context, cfg datastore.Config) (datastore.DataStore, error) {
	url := fmt.Sprintf("mongodb://%s:%s@%s", cfg.User, cfg.Password, cfg.Address)
	clientOpts := options.Client().ApplyURI(url)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, err
	}

	m := &mongodb{
		client:   client,
		database: cfg.Database,
	}
	return m, nil
}

func (m *mongodb) Put(ctx context.Context, kind string, entity interface{}) error {
	collection := m.client.Database(m.database).Collection(kind)
	_, err := collection.InsertOne(ctx, entity)
	if err != nil {
		return err
	}
	return nil
}

func (m *mongodb) Find(ctx context.Context, kind string) (datastore.Iterator, error) {
	collection := m.client.Database(m.database).Collection(kind)
	// bson.D{{}} specifies 'all documents'
	filter := bson.D{{}}
	cur, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	return &Iterator{cur: cur}, nil
}
func (m *mongodb) Delete(ctx context.Context, kind, name string) error {
	collection := m.client.Database(m.database).Collection(kind)
	// delete at most one document in which the "name" field is "Bob" or "bob"
	// specify the SetCollation option to provide a collation that will ignore case for string comparisons
	opts := options.Delete().SetCollation(&options.Collation{
		Locale:    "en_US",
		Strength:  1,
		CaseLevel: false,
	})
	_, err := collection.DeleteOne(ctx, bson.D{{"name", name}}, opts)
	return err
}
