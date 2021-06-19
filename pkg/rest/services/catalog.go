package services

import (
	"fmt"
	"github.com/pkg/errors"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
	"github.com/oam-dev/velacp/pkg/rest/apis"
	"go.mongodb.org/mongo-driver/mongo"
)

type CatalogService struct {
	store storeadapter.CatalogStore

	capStore storeadapter.CapabilityStore
}

func NewCatalogService(store storeadapter.CatalogStore, capStore storeadapter.CapabilityStore) *CatalogService {
	return &CatalogService{
		store:    store,
		capStore: capStore,
	}
}

func (s *CatalogService) ListCatalogs(c echo.Context) error {
	catalogs, err := s.store.ListCatalogs()
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.CatalogListResponse{Catalogs: catalogs})
}

func (s *CatalogService) GetCatalog(c echo.Context) error {
	catalogName := c.Param("catalogName")
	catalog, err := s.store.GetCatalog(catalogName)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.CatalogResponse{Catalog: catalog})
}

func (s *CatalogService) AddCatalog(c echo.Context) error {
	catalogReq := new(apis.CatalogRequest)
	if err := c.Bind(catalogReq); err != nil {
		return err
	}
	exist, err := s.checkCatalogExist(catalogReq.Name)
	if err != nil {
		return err
	}
	if exist {
		return c.JSON(http.StatusInternalServerError, fmt.Sprintf("catalog %s exist", catalogReq.Name))
	}
	catalog := convertToCatalog(catalogReq)
	if err := s.store.AddCatalog(&catalog); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, apis.CatalogMeta{Catalog: &catalog})
}

func (s *CatalogService) UpdateCatalog(c echo.Context) error {
	catalogReq := new(apis.CatalogRequest)
	if err := c.Bind(catalogReq); err != nil {
		return err
	}
	catalog := convertToCatalog(catalogReq)
	if err := s.store.PutCatalog(&catalog); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, apis.CatalogMeta{Catalog: &catalog})
}

func (s *CatalogService) DelCatalog(c echo.Context) error {
	catalogName := c.Param("catalogName")
	if err := s.store.DelCatalog(catalogName); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, true)
}

// SyncCatalog syncs a catalog's capabilities, save them in capability store.
//
// TODO: implement this method,
// sync logic is same as the `vela` cli, we should find a way to reuse these code:
// https://github.com/oam-dev/kubevela/blob/9a10e967eec8e42a8aa284ddb20fde204696aa69/references/common/capability.go#L261
func (s *CatalogService) SyncCatalog(c echo.Context) error {
	catalogName := c.Param("catalogName")

	capabilities := []*model.Capability{
		{
			Name:        catalogName + "-foo",
			Desc:        "Just a placeholder",
			UpdatedAt:   time.Now().Unix(),
			CatalogName: catalogName,
			JsonSchema:  "{}",
		},
		{
			Name:        catalogName + "-bar",
			Desc:        "Just a placeholder",
			UpdatedAt:   time.Now().Unix(),
			CatalogName: catalogName,
			JsonSchema:  "{}",
		},
	}

	currentInStore, err := s.capStore.ListCapabilitiesByCatalog(catalogName)
	if err != nil {
		return errors.Wrap(err, "list capabilities by catalog error")
	}
	mapCurrentInStore := make(map[string]*model.Capability)
	for _, capability := range currentInStore {
		mapCurrentInStore[capability.Name] = capability
	}

	for _, capability := range capabilities {
		if _, ok := mapCurrentInStore[capability.Name]; ok {
			if err := s.capStore.PutCapability(capability); err != nil {
				return err
			}
			delete(mapCurrentInStore, capability.Name)
		} else {
			if err := s.capStore.AddCapability(capability); err != nil {
				return err
			}
		}
	}

	// in store, but no longer in catalog
	for name := range mapCurrentInStore {
		if err := s.capStore.DelCapability(name); err != nil {
			return err
		}
	}

	return c.JSON(http.StatusOK, true)
}

// checkCatalogExist check whether catalog exist with name
func (s *CatalogService) checkCatalogExist(name string) (bool, error) {
	catalog, err := s.store.GetCatalog(name)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}
	if len(catalog.Name) != 0 {
		return true, nil
	}
	return false, nil
}

// convertToCatalog get catalog model from request
func convertToCatalog(catalogReq *apis.CatalogRequest) model.Catalog {
	return model.Catalog{
		Name:      catalogReq.Name,
		Desc:      catalogReq.Desc,
		UpdatedAt: time.Now().Unix(),
		Type:      catalogReq.Type,
		Url:       catalogReq.Url,
		Token:     catalogReq.Token,
	}
}
