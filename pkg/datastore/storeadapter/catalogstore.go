package storeadapter

import (
	"context"
	"errors"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const (
	catalogKind     = "Catalog"
	catalogRepoKind = "CatalogRepo"
)

type CatalogStore interface {
	PutCatalog(ctx context.Context, catalog *model.Catalog) error

	DelCatalog(ctx context.Context, name string) error

	GetCatalog(ctx context.Context, name string) (*model.Catalog, error)

	ListCatalogs(ctx context.Context) ([]*model.Catalog, error)

	// If version is empty (""), then all versions will be returned.
	GetPackage(ctx context.Context, catalogName, pkgName, version string) (*model.Package, error)

	PutPackages(ctx context.Context, catalogName string, plist []*model.Package) error

	ListPackages(ctx context.Context, catalogName string) ([]*model.Package, error)
}

func NewCatalogStore(ds datastore.DataStore) CatalogStore {
	return &catalogStore{ds: ds}
}

type catalogStore struct {
	ds datastore.DataStore
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

func (c *catalogStore) ListPackages(ctx context.Context, catalogName string) ([]*model.Package, error) {
	catalog := &model.CatalogRepo{}
	err := c.ds.Get(ctx, catalogRepoKind, catalogName, catalog)
	if err != nil {
		return nil, err
	}
	return catalog.Packages, nil
}

func (c *catalogStore) GetPackage(ctx context.Context, catalogName, pkgName, version string) (*model.Package, error) {
	packages, err := c.ListPackages(ctx, catalogName)
	if err != nil {
		return nil, err
	}
	for _, p := range packages {
		if p.Name != pkgName {
			continue
		}
		if version == "" {
			return p, nil
		}
		cp := p.Clone()
		for _, v := range p.Versions {
			if v.Version != version {
				continue
			}
			cp.Versions = []*model.PackageVersion{v.Clone()}
			return cp, nil
		}
	}
	return nil, errors.New("package not found")
}

func (c *catalogStore) PutPackages(ctx context.Context, catalogName string, plist []*model.Package) error {
	catalog := &model.CatalogRepo{
		Name:     catalogName,
		Packages: plist,
	}
	return c.ds.Put(ctx, catalogRepoKind, catalog)
}
