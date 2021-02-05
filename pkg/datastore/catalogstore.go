package datastore

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const catalogKind = "Catalog"

type CatalogStore interface {
	PutCatalog(ctx context.Context, catalog *model.Catalog) error
	DelCatalog(ctx context.Context, name string) error
	GetCatalog(ctx context.Context, name string) (*model.Catalog, error)
	ListCatalogs(ctx context.Context) ([]*model.Catalog, error)
	PutPackages(ctx context.Context, plist []*model.Package) error
}

func NewCatalogStore(ds DataStore) CatalogStore {
	return &catalogStore{ds: ds}
}

type catalogStore struct {
	ds DataStore
}

func (c *catalogStore) GetCatalog(ctx context.Context, name string) (*model.Catalog, error) {
	res := &model.Catalog{}
	err := c.ds.Get(ctx, catalogKind, name, res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (c *catalogStore) DelCatalog(ctx context.Context, name string) error {
	return c.ds.Delete(ctx, catalogKind, name)
}

func (c *catalogStore) PutCatalog(ctx context.Context, catalog *model.Catalog) error {
	return c.ds.Put(ctx, catalogKind, catalog)
}

func (c *catalogStore) ListCatalogs(ctx context.Context) ([]*model.Catalog, error) {
	iter, err := c.ds.Find(ctx, catalogKind)
	if err != nil {
		return nil, err
	}
	cs := make([]*model.Catalog, 0)
	for iter.Next(ctx) {
		var c model.Catalog
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	iter.Close(ctx)
	return cs, nil
}

func (c *catalogStore) PutPackages(ctx context.Context, plist []*model.Package) error {
	return nil
}
