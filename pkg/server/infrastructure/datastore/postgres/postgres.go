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

	postgresorm "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sql"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sqlnamer"
)

type postgres struct {
	sql.Driver
}

// New postgres datastore instance
func New(ctx context.Context, cfg datastore.Config) (datastore.DataStore, error) {

	db, err := gorm.Open(postgresorm.Open(cfg.URL), &gorm.Config{
		NamingStrategy:                           sqlnamer.SQLNamer{},
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.Default.LogMode(logger.Error),
		TranslateError:                           true,
	})

	if err != nil {
		return nil, err
	}

	for _, v := range model.GetRegisterModels() {
		if err := db.WithContext(ctx).AutoMigrate(v); err != nil {
			return nil, err
		}
	}

	p := &postgres{
		Driver: sql.Driver{
			Client: *db.WithContext(ctx),
		},
	}
	return p, nil
}
