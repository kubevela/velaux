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
	url := fmt.Sprintf("mongodb://%s", cfg.URL)
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

func (m *mongodb) Add(ctx context.Context, kind string, entity interface{}) error {
	collection := m.client.Database(m.database).Collection(kind)
	_, err := collection.InsertOne(ctx, entity)
	if err != nil {
		return err
	}
	return nil
}

func (m *mongodb) Get(ctx context.Context, kind, name string, decodeTo interface{}) error {
	collection := m.client.Database(m.database).Collection(kind)
	return collection.FindOne(ctx, makeNameFilter(name)).Decode(decodeTo)
}

func (m *mongodb) Put(ctx context.Context, kind, name string, entity interface{}) error {
	collection := m.client.Database(m.database).Collection(kind)
	_, err := collection.UpdateOne(ctx, makeNameFilter(name), makeEntityUpdate(entity))
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

func (m *mongodb) FindOne(ctx context.Context, kind, name string) (datastore.Iterator, error) {
	collection := m.client.Database(m.database).Collection(kind)
	filter := bson.M{"name": name}
	cur, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	return &Iterator{cur: cur}, nil
}

func (m *mongodb) IsExist(ctx context.Context, kind, name string) (bool, error) {
	collection := m.client.Database(m.database).Collection(kind)
	err := collection.FindOne(ctx, makeNameFilter(name)).Err()
	if err == mongo.ErrNoDocuments {
		return false, nil
	} else if err != nil {
		return false, err
	}

	return true, nil
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
	_, err := collection.DeleteOne(ctx, makeNameFilter(name), opts)
	return err
}

func makeNameFilter(name string) bson.D {
	return bson.D{{Key: "name", Value: name}}
}

func makeEntityUpdate(entity interface{}) bson.M {
	return bson.M{"$set": entity}
}
