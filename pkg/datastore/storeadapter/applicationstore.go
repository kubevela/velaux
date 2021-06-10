package storeadapter

import (
	"context"
	"encoding/json"
	"github.com/oam-dev/velacp/pkg/proto/model"

	"github.com/oam-dev/velacp/pkg/datastore"
)

const (
	applicationKind = "application"
)

var _ ApplicationStore = &applicationStore{}

type ApplicationStore interface {
	AddApplication(application *model.Application) error
	PutApplication(application *model.Application) error
	ListApplications(appName string) ([]*model.Application, error)
	GetApplications(appName string) (*model.Application, error)
	DelApplication(appName string) error
	IsApplicationExist(appName string) (bool, error)
}

func NewApplicationStore(ds datastore.DataStore) ApplicationStore {
	return &applicationStore{
		ds: ds,
	}
}

type applicationStore struct {
	ds datastore.DataStore
}

func (c *applicationStore) AddApplication(application *model.Application) error {
	ctx := context.Background()
	appBytes, err := json.Marshal(application)
	if err != nil {
		return err
	}

	var app interface{}
	if err := json.Unmarshal(appBytes, &app); err != nil {
		return err
	}

	if err := c.ds.Add(ctx, applicationKind, app); err != nil {
		return err
	}

	return nil
}

func (c *applicationStore) PutApplication(application *model.Application) error {
	ctx := context.Background()
	appBytes, err := json.Marshal(application)
	if err != nil {
		return err
	}

	var app interface{}
	if err := json.Unmarshal(appBytes, &app); err != nil {
		return err
	}

	if err := c.ds.Put(ctx, applicationKind, application.Name, app); err != nil {
		return err
	}

	return nil
}

func (c *applicationStore) ListApplications(appName string) ([]*model.Application, error) {
	var (
		records datastore.Iterator
		err     error
	)
	ctx := context.Background()
	if len(appName) != 0 {
		records, err = c.ds.FindOne(ctx, applicationKind, appName)
	} else {
		records, err = c.ds.Find(ctx, applicationKind)
	}

	if err != nil {
		return nil, err
	}
	defer records.Close(ctx)
	cs := make([]*model.Application, 0)
	for records.Next(ctx) {
		var unStruct map[string]interface{}
		err := records.Decode(&unStruct)
		if err != nil {
			return nil, err
		}

		unStructBytes, err := json.Marshal(unStruct)
		if err != nil {
			return nil, err
		}

		var app model.Application
		if err := json.Unmarshal(unStructBytes, &app); err != nil {
			return nil, err
		}

		cs = append(cs, &app)
	}
	return cs, nil
}

func (c *applicationStore) DelApplication(appName string) error {
	ctx := context.Background()
	if err := c.ds.Delete(ctx, applicationKind, appName); err != nil {
		return err
	}

	return nil
}

func (c *applicationStore) IsApplicationExist(appName string) (bool, error) {
	ctx := context.Background()
	return c.ds.IsExist(ctx, applicationKind, appName)
}

func (c *applicationStore) GetApplications(appName string) (*model.Application, error) {
	ctx := context.Background()
	var app model.Application
	if err := c.ds.Get(ctx, applicationKind, appName, &app); err != nil {
		return nil, err
	}

	return &app, nil
}
