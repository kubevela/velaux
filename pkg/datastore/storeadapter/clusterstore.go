package storeadapter

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/proto/model"
)

const (
	clusterKind = "cluster"
)

var _ ClusterStore = &clusterStore{}

type ClusterStore interface {
	PutCluster(cluster *model.Cluster) error
	ListClusters() ([]*model.Cluster, error)
	DelCluster(name string) error
}

func NewClusterStore(ds datastore.DataStore) ClusterStore {
	return &clusterStore{
		ds: ds,
	}
}

type clusterStore struct {
	ds datastore.DataStore
}

func (c *clusterStore) PutCluster(cluster *model.Cluster) error {
	panic("implement me")
}

func (c *clusterStore) ListClusters() ([]*model.Cluster, error) {
	ctx := context.Background()
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

func (c *clusterStore) DelCluster(name string) error {
	panic("implement me")
}
