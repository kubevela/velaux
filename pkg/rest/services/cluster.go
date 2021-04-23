package services

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
)

type ClusterService struct {
	store storeadapter.ClusterStore
}

func NewClusterService(store storeadapter.ClusterStore) *ClusterService {
	return &ClusterService{
		store: store,
	}
}

func (s *ClusterService) GetClusters(c echo.Context) error {
	clusters, err := s.store.ListClusters()
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.ClusterListResponse{
		Clusters: clusters,
	})
}
