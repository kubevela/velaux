package services

import (
	"context"
	"time"

	"go.uber.org/zap"

	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
)

var _ clusterservice.ClusterServiceServer = &ClusterService{}

type ClusterService struct {
	store  storeadapter.ClusterStore
	logger *zap.Logger
}

func NewClusterService(store storeadapter.ClusterStore, l *zap.Logger) *ClusterService {
	s := &ClusterService{
		store:  store,
		logger: l,
	}
	return s
}

func (s *ClusterService) PutCluster(ctx context.Context, request *clusterservice.PutClusterRequest) (*clusterservice.PutClusterResponse, error) {
	cluster := request.Cluster.Clone()
	cluster.UpdatedAt = time.Now().Unix()

	err := s.store.PutCluster(ctx, cluster)
	if err != nil {
		return nil, err
	}
	return &clusterservice.PutClusterResponse{}, nil
}

func (s *ClusterService) GetCluster(ctx context.Context, request *clusterservice.GetClusterRequest) (*clusterservice.GetClusterResponse, error) {
	cluster, err := s.store.GetCluster(ctx, request.Name)
	if err != nil {
		return nil, err
	}

	return &clusterservice.GetClusterResponse{
		Cluster: cluster,
	}, nil
}

func (s *ClusterService) ListClusters(ctx context.Context, request *clusterservice.ListClustersRequest) (*clusterservice.ListClustersResponse, error) {
	clusters, err := s.store.ListClusters(ctx)
	if err != nil {
		return nil, err
	}
	return &clusterservice.ListClustersResponse{
		Clusters: clusters,
	}, nil
}

func (s *ClusterService) DelCluster(ctx context.Context, request *clusterservice.DelClusterRequest) (*clusterservice.DelClusterResponse, error) {
	err := s.store.DelCluster(ctx, request.Name)
	if err != nil {
		return nil, err
	}
	return &clusterservice.DelClusterResponse{}, nil
}
