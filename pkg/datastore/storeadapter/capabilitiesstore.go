package storeadapter

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/proto/model"
)

const (
	capabilityKind = "capability"
)

var _ CapabilityStore = &capabilityStore{}

// CapabilityStore
//
// FIXME: is capability name unique across all catalogs?
// it seems to be no because we cannot ensure names are unique across catalogs provided by different vendors,
// but if so, we need to refactor the whole CapabilityStore to use catalogName + name as the primary key.
type CapabilityStore interface {
	AddCapability(capability *model.Capability) error
	PutCapability(capability *model.Capability) error
	GetCapability(name string) (*model.Capability, error)
	ListCapabilities() ([]*model.Capability, error)
	ListCapabilitiesByCatalog(catalogName string) ([]*model.Capability, error)
	DelCapability(name string) error
}

func NewCapabilityStore(ds datastore.DataStore) CapabilityStore {
	return &capabilityStore{
		ds: ds,
	}
}

type capabilityStore struct {
	ds datastore.DataStore
}

func (c *capabilityStore) AddCapability(capability *model.Capability) error {
	ctx := context.Background()
	if err := c.ds.Add(ctx, capabilityKind, capability); err != nil {
		return err
	}
	return nil
}

func (c *capabilityStore) PutCapability(capability *model.Capability) error {
	ctx := context.Background()
	if err := c.ds.Put(ctx, capabilityKind, capability.Name, capability); err != nil {
		return err
	}
	return nil
}

func (c *capabilityStore) GetCapability(name string) (*model.Capability, error) {
	ctx := context.Background()
	capability := &model.Capability{}
	err := c.ds.Get(ctx, capabilityKind, name, capability)
	if err != nil {
		return nil, err
	}
	return capability, nil
}

func (c *capabilityStore) ListCapabilities() ([]*model.Capability, error) {
	ctx := context.Background()
	iter, err := c.ds.Find(ctx, capabilityKind)
	if err != nil {
		return nil, err
	}
	defer iter.Close(ctx)
	cs := make([]*model.Capability, 0)
	for iter.Next(ctx) {
		var c model.Capability
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	return cs, nil
}

func (c *capabilityStore) ListCapabilitiesByCatalog(catalogName string) ([]*model.Capability, error) {
	ctx := context.Background()
	iter, err := c.ds.Find(ctx, capabilityKind)
	if err != nil {
		return nil, err
	}
	defer iter.Close(ctx)
	cs := make([]*model.Capability, 0)
	for iter.Next(ctx) {
		var c model.Capability
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		// TODO: should filter results in database query instead of here
		if c.CatalogName != catalogName {
			continue
		}
		cs = append(cs, &c)
	}
	return cs, nil
}

func (c *capabilityStore) DelCapability(name string) error {
	ctx := context.Background()
	err := c.ds.Delete(ctx, capabilityKind, name)
	if err != nil {
		return err
	}
	return nil
}
