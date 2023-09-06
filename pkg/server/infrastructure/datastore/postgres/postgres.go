/*
Copyright 2021 The KubeVela Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package postgres

import (
	"context"
	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sql"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sqlnamer"
	postgresorm "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type postgres struct {
	delegate sql.Driver
}

// New postgres datastore instance
func New(ctx context.Context, cfg datastore.Config) (datastore.DataStore, error) {

	db, err := gorm.Open(postgresorm.Open(cfg.URL), &gorm.Config{
		NamingStrategy:                           sqlnamer.SQLNamer{},
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Error),
	})

	if err != nil {
		return nil, err
	}

	for _, v := range model.GetRegisterModels() {
		if err := db.WithContext(ctx).AutoMigrate(v); err != nil {
			return nil, err
		}
	}

	m := &postgres{
		delegate: sql.Driver{
			Client: *db.WithContext(ctx),
		},
	}
	return m, nil
}

// Add add data model
func (m *postgres) Add(ctx context.Context, entity datastore.Entity) error {
	return m.delegate.Add(ctx, entity)
}

// BatchAdd batch add entity, this operation has some atomicity.
func (m *postgres) BatchAdd(ctx context.Context, entities []datastore.Entity) error {
	return m.delegate.BatchAdd(ctx, entities)
}

// Get get data model
func (m *postgres) Get(ctx context.Context, entity datastore.Entity) error {
	return m.delegate.Get(ctx, entity)
}

// Put update data model
func (m *postgres) Put(ctx context.Context, entity datastore.Entity) error {
	return m.delegate.Put(ctx, entity)
}

// IsExist determine whether data exists.
func (m *postgres) IsExist(ctx context.Context, entity datastore.Entity) (bool, error) {
	return m.delegate.IsExist(ctx, entity)
}

// Delete delete data
func (m *postgres) Delete(ctx context.Context, entity datastore.Entity) error {
	return m.delegate.Delete(ctx, entity)
}

// List list entity function
func (m *postgres) List(ctx context.Context, entity datastore.Entity, op *datastore.ListOptions) ([]datastore.Entity, error) {
	return m.delegate.List(ctx, entity, op)
}

// Count counts entities
func (m *postgres) Count(ctx context.Context, entity datastore.Entity, filterOptions *datastore.FilterOptions) (int64, error) {
	return m.delegate.Count(ctx, entity, filterOptions)
}
