package services

import (
	"context"

	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

type CatalogService struct {
	
}

func (c CatalogService) AddCatalog(ctx context.Context, request *catalogservice.AddCatalogRequest) (*catalogservice.AddCatalogResponse, error) {
	panic("implement me")
}

func (c CatalogService) GetCatalog(ctx context.Context, request *catalogservice.GetCatalogRequest) (*catalogservice.GetCatalogResponse, error) {
	panic("implement me")
}

func (c CatalogService) ListCatalogs(ctx context.Context, request *catalogservice.ListCatalogsRequest) (*catalogservice.ListCatalogsResponse, error) {
	panic("implement me")
}

func (c CatalogService) DelCatalog(ctx context.Context, request *catalogservice.DelCatalogRequest) (*catalogservice.DelCatalogResponse, error) {
	panic("implement me")
}

func (c CatalogService) mustEmbedUnimplementedCatalogServiceServer() {
	panic("implement me")
}




