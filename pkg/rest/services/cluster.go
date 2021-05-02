package services

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
	"github.com/oam-dev/velacp/pkg/rest/apis"
	"go.mongodb.org/mongo-driver/mongo"
)

type ClusterService struct {
	store storeadapter.ClusterStore
}

func NewClusterService(store storeadapter.ClusterStore) *ClusterService {
	return &ClusterService{
		store: store,
	}
}

func (s *ClusterService) GetClusterNames(c echo.Context) error {
	clusters, err := s.store.ListClusters()
	if err != nil {
		return err
	}
	names := []string{}
	for _, cluster := range clusters {
		names = append(names, cluster.Name)
	}

	return c.JSON(http.StatusOK, apis.ClustersMeta{Clusters: names})
}

func (s *ClusterService) GetClusters(c echo.Context) error {
	clusters, err := s.store.ListClusters()
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.ClusterListResponse{Clusters: clusters})
}

func (s *ClusterService) AddCluster(c echo.Context) error {
	clusterReq := new(apis.ClusterRequest)
	if err := c.Bind(clusterReq); err != nil {
		return err
	}
	exist, err := s.checkClusterExist(clusterReq.Name)
	if err != nil {
		return err
	}
	if exist {
		return c.JSON(http.StatusInternalServerError, fmt.Sprintf("cluster %s exist", clusterReq.Name))
	}
	cluster := convertToCluster(clusterReq)
	if err := s.store.AddCluster(&cluster); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, apis.ClusterMeta{Cluster: &cluster})
}

func (s *ClusterService) UpdateCluster(c echo.Context) error {
	clusterReq := new(apis.ClusterRequest)
	if err := c.Bind(clusterReq); err != nil {
		return err
	}
	cluster := convertToCluster(clusterReq)
	if err := s.store.PutCluster(&cluster); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, apis.ClusterMeta{Cluster: &cluster})
}

func (s *ClusterService) DelCluster(c echo.Context) error {
	clusterName := c.Param("clusterName")
	if err := s.store.DelCluster(clusterName); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, true)
}

// checkClusterExist check whether cluster exist with name
func (s *ClusterService) checkClusterExist(name string) (bool, error) {
	cluster, err := s.store.GetCluster(name)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}
	if len(cluster.Name) != 0 {
		return true, nil
	}
	return false, nil
}

// convertToCluster get cluster model from request
func convertToCluster(clusterReq *apis.ClusterRequest) model.Cluster {
	return model.Cluster{
		Name:       clusterReq.Name,
		Desc:       clusterReq.Desc,
		UpdatedAt:  time.Now().Unix(),
		Kubeconfig: clusterReq.Kubeconfig,
	}
}
