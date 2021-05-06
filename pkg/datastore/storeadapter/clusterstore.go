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
	AddCluster(cluster *model.Cluster) error
	PutCluster(cluster *model.Cluster) error
	GetCluster(name string) (*model.Cluster, error)
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

func (c *clusterStore) AddCluster(cluster *model.Cluster) error {
	ctx := context.Background()
	if err := c.ds.Add(ctx, clusterKind, cluster); err != nil {
		return err
	}
	return nil
}

func (c *clusterStore) PutCluster(cluster *model.Cluster) error {
	ctx := context.Background()
	if err := c.ds.Put(ctx, clusterKind, cluster.Name, cluster); err != nil {
		return err
	}
	return nil
}

func (c *clusterStore) GetCluster(name string) (*model.Cluster, error) {
	ctx := context.Background()
	cluster := &model.Cluster{}
	err := c.ds.Get(ctx, clusterKind, name, cluster)
	if err != nil {
		return nil, err
	}
	return cluster, nil
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
	ctx := context.Background()
	err := c.ds.Delete(ctx, clusterKind, name)
	if err != nil {
		return err
	}
	return nil
}
