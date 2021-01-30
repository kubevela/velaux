package datastore

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const catalogKind = "Catalog"

type CatalogStore interface {
	ListCatalogs(ctx context.Context) ([]*model.Catalog, error)
}

func NewCatalogStore(ds DataStore) CatalogStore {
	return &catalogStore{ds: ds}
}

type catalogStore struct {
	ds DataStore
}

func (c *catalogStore) ListCatalogs(ctx context.Context) ([]*model.Catalog, error) {
	iter, err := c.ds.Find(ctx, catalogKind)
	if err != nil {
		return nil, err
	}
	cs := make([]*model.Catalog, 0)
	for iter.Next() {
		var c model.Catalog
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	return cs, nil
}
