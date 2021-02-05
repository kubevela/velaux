package services

import (
	"bufio"
	"context"
	"os"
	"path"
	"time"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/storage/memory"
	"github.com/google/uuid"
	"gopkg.in/yaml.v2"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/datastore/model"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

type CatalogService struct {
	Store datastore.CatalogStore
}

func (c *CatalogService) PutCatalog(ctx context.Context, request *catalogservice.PutCatalogRequest) (*catalogservice.PutCatalogResponse, error) {
	catalog := request.Catalog.Clone()
	catalog.Id = uuid.New().String()
	now := time.Now().Unix()
	catalog.UpdatedAt = now

	err := c.Store.PutCatalog(ctx, catalog)
	if err != nil {
		return nil, err
	}
	return &catalogservice.PutCatalogResponse{}, nil
}

func (c *CatalogService) GetCatalog(ctx context.Context, request *catalogservice.GetCatalogRequest) (*catalogservice.GetCatalogResponse, error) {
	res, err := c.Store.GetCatalog(ctx, request.Name)
	if err != nil {
		return nil, err
	}
	return &catalogservice.GetCatalogResponse{Catalog: res}, nil

}

func (c *CatalogService) ListCatalogs(ctx context.Context, request *catalogservice.ListCatalogsRequest) (*catalogservice.ListCatalogsResponse, error) {
	catalogs, err := c.Store.ListCatalogs(ctx)
	if err != nil {
		return nil, err
	}
	return &catalogservice.ListCatalogsResponse{
		Catalogs: catalogs,
	}, nil
}

func (c *CatalogService) DelCatalog(ctx context.Context, request *catalogservice.DelCatalogRequest) (*catalogservice.DelCatalogResponse, error) {
	err := c.Store.DelCatalog(ctx, request.Name)
	if err != nil {
		return nil, err
	}
	return &catalogservice.DelCatalogResponse{}, nil
}

func (c *CatalogService) SyncCatalog(ctx context.Context, request *catalogservice.SyncCatalogRequest) (*catalogservice.SyncCatalogResponse, error) {
	getres, err := c.GetCatalog(ctx, &catalogservice.GetCatalogRequest{Name: request.Name})
	if err != nil {
		return nil, err
	}

	plist, err := scanRepo(ctx, getres.Catalog.Url, getres.Catalog.Rootdir)
	if err != nil {
		return nil, err
	}

	err = c.Store.PutPackages(ctx, plist)
	if err != nil {
		return nil, err
	}
	return &catalogservice.SyncCatalogResponse{}, nil
}

func scanRepo(ctx context.Context, url string, rootdir string) ([]*model.Package, error) {
	var plist []*model.Package

	if rootdir == "" {
		rootdir = "catalog/"
	}

	// Filesystem abstraction based on memory
	fs := memfs.New()
	// Git objects storer based on memory
	storer := memory.NewStorage()

	_, err := git.CloneContext(ctx, storer, fs, &git.CloneOptions{
		URL:   url,
		Depth: 1,
	})
	if err != nil {
		return nil, err
	}

	r := &repo{
		fs:      fs,
		rootdir: rootdir,
	}

	packages, err := fs.ReadDir(rootdir)
	if err != nil {
		return nil, err
	}
	for _, file := range packages {
		if !file.IsDir() {
			continue
		}
		p, err := r.scanPackage(file)
		if err != nil {
			return nil, err
		}
		if p != nil {
			plist = append(plist, p)
		}
	}
	return plist, nil
}

type repo struct {
	fs      billy.Filesystem
	rootdir string
}

func (r *repo) scanPackage(dir os.FileInfo) (*model.Package, error) {
	p, err := r.readPackageMetadata(dir.Name())
	if err != nil {
		return nil, err
	}

	versions, err := r.fs.ReadDir(path.Join(r.rootdir, dir.Name()))
	if err != nil {
		return nil, err
	}
	for _, file := range versions {
		if !file.IsDir() {
			continue
		}
		pv, err := r.scanPackageVersion(dir.Name(), file.Name())
		if err != nil {
			return nil, err
		}
		p.Versions = append(p.Versions, pv)
	}
	return p, nil
}

func (r *repo) readPackageMetadata(name string) (*model.Package, error) {
	p := &model.Package{}
	f, err := r.fs.Open(path.Join(r.rootdir, name, "package.yaml"))
	if err != nil {
		return nil, err
	}
	defer f.Close()

	dec := yaml.NewDecoder(bufio.NewReader(f))
	err = dec.Decode(p)
	if err != nil {
		return nil, err
	}

	p.Name = name
	return p, nil
}

func (r *repo) scanPackageVersion(pkg, ver string) (*model.PackageVersion, error) {
	pv := &model.PackageVersion{}

	pv.Version = ver

	pvdir := path.Join(r.rootdir, pkg, ver)

	modules, err := r.readModules(path.Join(pvdir, "modules.yaml"))
	if err != nil {
		return nil, err
	}
	pv.Modules = modules

	return pv, nil
}

type modules struct {
	Modules []*model.Module
}

func (r *repo) readModules(fp string) ([]*model.Module, error) {
	f, err := r.fs.Open(fp)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	dec := yaml.NewDecoder(bufio.NewReader(f))
	raw := &modules{}
	err = dec.Decode(raw)
	if err != nil {
		return nil, err
	}
	res := make([]*model.Module, 0, len(raw.Modules))
	for _, m := range raw.Modules {
		res = append(res, m.Clone())
	}
	return res, nil
}
