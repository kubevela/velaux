package services

import (
	"context"
	"time"

	"go.uber.org/zap"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
)

var _ clusterservice.ClusterServiceServer = &ClusterService{}

type ClusterService struct {
	store  datastore.ClusterStore
	logger *zap.Logger
}

func NewClusterService(store datastore.ClusterStore, l *zap.Logger) *ClusterService {
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
	panic("implement me")
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
	panic("implement me")
}
