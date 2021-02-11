package datastore

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const (
	envKind = "Env"
)

type EnvStore interface {
	PutEnv(ctx context.Context, cluster *model.Environment) error
	ListEnvs(ctx context.Context) ([]*model.Environment, error)
	GetEnv(ctx context.Context, name string) (*model.Environment, error)
	DelEnv(ctx context.Context, name string) error
}

type envStore struct {
	ds DataStore
}

func NewEnvStore(ds DataStore) EnvStore {
	return &envStore{
		ds: ds,
	}
}

func (c *envStore) PutEnv(ctx context.Context, cluster *model.Environment) error {
	return c.ds.Put(ctx, envKind, cluster)
}
func (c *envStore) ListEnvs(ctx context.Context) ([]*model.Environment, error) {
	iter, err := c.ds.Find(ctx, envKind)
	if err != nil {
		return nil, err
	}
	defer iter.Close(ctx)
	cs := make([]*model.Environment, 0)
	for iter.Next(ctx) {
		var c model.Environment
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	return cs, nil
}
func (c *envStore) GetEnv(ctx context.Context, name string) (*model.Environment, error) {
	res := &model.Environment{}
	err := c.ds.Get(ctx, envKind, name, res)
	if err != nil {
		return nil, err
	}
	return res, nil
}
func (c *envStore) DelEnv(ctx context.Context, name string) error {
	return c.ds.Delete(ctx, envKind, name)
}
