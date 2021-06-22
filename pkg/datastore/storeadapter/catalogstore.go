package storeadapter

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/proto/model"
)

const (
	catalogKind = "catalog"
)

var _ CatalogStore = &catalogStore{}

type CatalogStore interface {
	AddCatalog(catalog *model.Catalog) error
	PutCatalog(catalog *model.Catalog) error
	GetCatalog(name string) (*model.Catalog, error)
	ListCatalogs() ([]*model.Catalog, error)
	DelCatalog(name string) error
}

func NewCatalogStore(ds datastore.DataStore) CatalogStore {
	return &catalogStore{
		ds: ds,
	}
}

type catalogStore struct {
	ds datastore.DataStore
}

func (c *catalogStore) AddCatalog(catalog *model.Catalog) error {
	ctx := context.Background()
	if err := c.ds.Add(ctx, catalogKind, catalog); err != nil {
		return err
	}
	return nil
}

func (c *catalogStore) PutCatalog(catalog *model.Catalog) error {
	ctx := context.Background()
	if err := c.ds.Put(ctx, catalogKind, catalog.Name, catalog); err != nil {
		return err
	}
	return nil
}

func (c *catalogStore) GetCatalog(name string) (*model.Catalog, error) {
	ctx := context.Background()
	catalog := &model.Catalog{}
	err := c.ds.Get(ctx, catalogKind, name, catalog)
	if err != nil {
		return nil, err
	}
	return catalog, nil
}

func (c *catalogStore) ListCatalogs() ([]*model.Catalog, error) {
	ctx := context.Background()
	iter, err := c.ds.Find(ctx, catalogKind)
	if err != nil {
		return nil, err
	}
	defer iter.Close(ctx)
	cs := make([]*model.Catalog, 0)
	for iter.Next(ctx) {
		var c model.Catalog
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	return cs, nil
}

func (c *catalogStore) DelCatalog(name string) error {
	ctx := context.Background()
	err := c.ds.Delete(ctx, catalogKind, name)
	if err != nil {
		return err
	}
	return nil
}
