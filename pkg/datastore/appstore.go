package datastore

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore/model"
)

const (
	applicationKind = "Application"
)

type ApplicationStore interface {
	PutApplication(ctx context.Context, cluster *model.Application) error
	ListApplications(ctx context.Context) ([]*model.Application, error)
	GetApplication(ctx context.Context, name string) (*model.Application, error)
	DelApplication(ctx context.Context, name string) error
}

type applicationStore struct {
	ds DataStore
}

func NewApplicationStore(ds DataStore) ApplicationStore {
	return &applicationStore{
		ds: ds,
	}
}

func (s *applicationStore) PutApplication(ctx context.Context, app *model.Application) error {
	return s.ds.Put(ctx, applicationKind, app)
}
func (s *applicationStore) ListApplications(ctx context.Context) ([]*model.Application, error) {
	iter, err := s.ds.Find(ctx, applicationKind)
	if err != nil {
		return nil, err
	}
	defer iter.Close(ctx)
	cs := make([]*model.Application, 0)
	for iter.Next(ctx) {
		var c model.Application
		err := iter.Decode(&c)
		if err != nil {
			return nil, err
		}
		cs = append(cs, &c)
	}
	return cs, nil
}
func (s *applicationStore) GetApplication(ctx context.Context, name string) (*model.Application, error) {
	res := &model.Application{}
	err := s.ds.Get(ctx, applicationKind, name, res)
	if err != nil {
		return nil, err
	}
	return res, nil
}
func (s *applicationStore) DelApplication(ctx context.Context, name string) error {
	return s.ds.Delete(ctx, applicationKind, name)
}
