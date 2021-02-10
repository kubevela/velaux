package datastore

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const (
	clusterKind = "Catalog"
)

type ClusterStore interface {
	PutCluster(ctx context.Context, cluster *model.Cluster) error
}

type clusterStore struct {
	ds DataStore
}

func NewClusterStore(ds DataStore) ClusterStore {
	return &clusterStore{
		ds: ds,
	}
}

func (c clusterStore) PutCluster(ctx context.Context, cluster *model.Cluster) error {
	return c.ds.Put(ctx, clusterKind, cluster)
}
