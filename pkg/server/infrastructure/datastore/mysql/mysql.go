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

package mysql

import (
	"context"
	"fmt"

	mysqlgorm "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

type mysql struct {
	client   gorm.DB
	database string
}

// New new mongodb datastore instance
func New(ctx context.Context, cfg datastore.Config) (datastore.DataStore, error) {
	db, err := gorm.Open(mysqlgorm.Open(cfg.URL), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	for _, v := range model.GetRegisterModels() {
		db.AutoMigrate(v)
	}

	m := &mysql{
		client:   *db,
		database: cfg.Database,
	}
	return m, nil
}

// Add add data model
func (m *mysql) Add(ctx context.Context, entity datastore.Entity) error {
	return fmt.Errorf("method to be implemented")
}

// BatchAdd batch add entity, this operation has some atomicity.
func (m *mysql) BatchAdd(ctx context.Context, entities []datastore.Entity) error {
	return fmt.Errorf("method to be implemented")
}

// Get get data model
func (m *mysql) Get(ctx context.Context, entity datastore.Entity) error {
	return fmt.Errorf("method to be implemented")
}

// Put update data model
func (m *mysql) Put(ctx context.Context, entity datastore.Entity) error {
	return fmt.Errorf("method to be implemented")
}

// IsExist determine whether data exists.
func (m *mysql) IsExist(ctx context.Context, entity datastore.Entity) (bool, error) {
	return true, fmt.Errorf("method to be implemented")
}

// Delete delete data
func (m *mysql) Delete(ctx context.Context, entity datastore.Entity) error {
	return fmt.Errorf("method to be implemented")
}

// List list entity function
func (m *mysql) List(ctx context.Context, entity datastore.Entity, op *datastore.ListOptions) ([]datastore.Entity, error) {
	return nil, fmt.Errorf("method to be implemented")
}

// Count counts entities
func (m *mysql) Count(ctx context.Context, entity datastore.Entity, filterOptions *datastore.FilterOptions) (int64, error) {
	return 0, fmt.Errorf("method to be implemented")
}
