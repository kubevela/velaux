package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/datastore/model"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

type CatalogService struct {
	Store datastore.CatalogStore
}

func (c *CatalogService) PutCatalog(ctx context.Context, request *catalogservice.PutCatalogRequest) (*catalogservice.PutCatalogResponse, error) {
	catalog := &model.Catalog{
		Id:   uuid.New().String(),
		Name: request.Name,
		Desc: request.Desc,
	}

	now := time.Now().Unix()
	if catalog.CreatedAt == 0 {
		catalog.CreatedAt = now
	}
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
