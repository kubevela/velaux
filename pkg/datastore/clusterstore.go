package datastore

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const (
	clusterKind = "Cluster"
)

type ClusterStore interface {
	PutCluster(ctx context.Context, cluster *model.Cluster) error
	ListClusters(ctx context.Context) ([]*model.Cluster, error)
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
func (c clusterStore) ListClusters(ctx context.Context) ([]*model.Cluster, error) {
	iter, err := c.ds.Find(ctx, clusterKind)
	if err != nil {
		return nil, err
	}
	defer iter.Close(ctx)
	cs := make([]*model.Cluster, 0)
	for iter.Next(ctx) {
		var c model.Cluster
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	return cs, nil
}
