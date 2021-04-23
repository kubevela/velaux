package services

import (
	"bufio"
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"sync"
	"time"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/storage/memory"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gopkg.in/yaml.v2"

	"github.com/oam-dev/velacp/pkg/datastore/model"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

var _ catalogservice.CatalogServiceServer = &CatalogService{}

const (
	DefaultCatalogRootdir = "catalog/"
)

type CatalogService struct {
	Store storeadapter.CatalogStore

	catalogMap sync.Map
	logger     *zap.Logger
}

type catalogMeta struct {
	url     string
	rootdir string
}

func makeRootDir(dir string) string {
	if dir == "" {
		return DefaultCatalogRootdir
	}
	return dir
}

func NewCatalogService(store storeadapter.CatalogStore, l *zap.Logger) *CatalogService {
	c := &CatalogService{
		Store:  store,
		logger: l,
	}

	res, err := c.ListCatalogs(context.TODO(), &catalogservice.ListCatalogsRequest{})
	if err != nil {
		panic(err)
	}
	for _, cat := range res.Catalogs {
		c.catalogMap.Store(cat.Name, &catalogMeta{
			url:     cat.Url,
			rootdir: makeRootDir(cat.Rootdir),
		})
	}

	return c
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
	catalog, err := c.Store.GetCatalog(ctx, request.Name)
	if err != nil {
		return nil, err
	}

	return &catalogservice.GetCatalogResponse{
		Catalog: catalog,
	}, nil
}

func (c *CatalogService) ListCatalogs(ctx context.Context, _ *catalogservice.ListCatalogsRequest) (*catalogservice.ListCatalogsResponse, error) {
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

func (c *CatalogService) ListPackages(ctx context.Context, request *catalogservice.ListPackagesRequest) (*catalogservice.ListPackagesResponse, error) {
	packages, err := c.Store.ListPackages(ctx, request.CatalogName)
	if err != nil {
		return nil, err
	}
	return &catalogservice.ListPackagesResponse{
		Packages: packages,
	}, nil
}

func (c *CatalogService) InstallPackage(ctx context.Context, request *catalogservice.InstallPackageRequest) (*catalogservice.InstallPackageResponse, error) {
	p, err := c.Store.GetPackage(ctx, request.CatalogName, request.PackageName, request.PackageVersion)
	if err != nil {
		return nil, err
	}

	cm, ok := c.catalogMap.Load(request.CatalogName)
	if !ok {
		return nil, fmt.Errorf("catalog (%s) not exist", request.CatalogName)
	}

	for _, pv := range p.Versions {
		err := c.installPackageVersion(ctx, cm.(*catalogMeta), p.Name, pv)
		if err != nil {
			return nil, err
		}
	}

	return &catalogservice.InstallPackageResponse{}, nil
}

func (c *CatalogService) installPackageVersion(ctx context.Context, cm *catalogMeta, pkgName string, pv *model.PackageVersion) error {
	for _, m := range pv.Modules {
		err := c.installModule(ctx, cm, pkgName, pv.Version, m)
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *CatalogService) installModule(ctx context.Context, cm *catalogMeta, pkgName, ver string, m *model.Module) error {
	switch {
	case m.Kube != nil:
		err := c.installNativeModule(ctx, cm, pkgName, ver, m.Kube)
		if err != nil {
			return err
		}
		c.logger.Info("installed native module successfully", zap.String("package", pkgName), zap.String("version", ver))
	case m.Helm != nil:
		err := c.installHelmModule(ctx, m.Helm)
		if err != nil {
			return err
		}
		c.logger.Info("installed helm module successfully", zap.String("package", pkgName), zap.String("version", ver))
	}
	return nil
}

func (c *CatalogService) installNativeModule(ctx context.Context, cm *catalogMeta, pkgName, ver string, m *model.KubeModule) error {
	if m.Url != "" {
		out, err := exec.CommandContext(ctx, "kubectl", "apply", "-f", m.Url).CombinedOutput()
		c.logger.Info(string(out))
		if err != nil {
			return err
		}
	}
	if m.Path != "" {
		// Tempdir to clone the repository
		dir, err := ioutil.TempDir("", "catalog-clone")
		if err != nil {
			log.Fatal(err)
		}

		defer os.RemoveAll(dir) // clean up

		// Clones the repository into the given dir, just as a normal git clone does
		_, err = git.PlainCloneContext(ctx, dir, false, &git.CloneOptions{
			URL:   cm.url,
			Depth: 1,
		})
		localPath := filepath.Join(dir, cm.rootdir, pkgName, ver, m.Path)

		out, err := exec.CommandContext(ctx, "kubectl", "apply", "-f", localPath).CombinedOutput()
		c.logger.Info(string(out))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *CatalogService) installHelmModule(ctx context.Context, m *model.HelmModule) error {
	out, err := exec.CommandContext(ctx, "helm", "repo", "add", m.Name, m.Repo).CombinedOutput()
	c.logger.Info(string(out))
	if err != nil {
		return err
	}

	installArgs := []string{"install", m.Name, m.Name + "/" + m.Name}
	if m.Version != "" {
		installArgs = append(installArgs, "--version", m.Version)
	}
	out, err = exec.CommandContext(ctx, "helm", installArgs...).CombinedOutput()
	c.logger.Info(string(out))
	if err != nil {
		return err
	}

	out, err = exec.CommandContext(ctx, "helm", "repo", "remove", m.Name).CombinedOutput()
	c.logger.Info(string(out))
	if err != nil {
		return err
	}
	return nil
}

func (c *CatalogService) SyncCatalog(ctx context.Context, request *catalogservice.SyncCatalogRequest) (*catalogservice.SyncCatalogResponse, error) {
	getres, err := c.GetCatalog(ctx, &catalogservice.GetCatalogRequest{Name: request.Name})
	if err != nil {
		return nil, err
	}

	cm := &catalogMeta{
		url:     getres.Catalog.Url,
		rootdir: makeRootDir(getres.Catalog.Rootdir),
	}
	c.catalogMap.Store(request.Name, cm)

	plist, err := scanRepo(ctx, cm)
	if err != nil {
		return nil, err
	}

	err = c.Store.PutPackages(ctx, request.Name, plist)
	if err != nil {
		return nil, err
	}
	return &catalogservice.SyncCatalogResponse{}, nil
}

func scanRepo(ctx context.Context, cm *catalogMeta) ([]*model.Package, error) {
	var plist []*model.Package

	// Filesystem abstraction based on memory
	fs := memfs.New()
	// Git objects storer based on memory
	storer := memory.NewStorage()

	_, err := git.CloneContext(ctx, storer, fs, &git.CloneOptions{
		URL:   cm.url,
		Depth: 1,
	})
	if err != nil {
		return nil, err
	}

	r := &repo{
		fs:      fs,
		rootdir: cm.rootdir,
	}

	packages, err := fs.ReadDir(cm.rootdir)
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
