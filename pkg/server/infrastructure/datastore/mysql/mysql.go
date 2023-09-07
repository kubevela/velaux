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

	mysqlgorm "gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sql"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/sqlnamer"
)

type mysql struct {
	sql.Driver
}

// New new mysql datastore instance
func New(ctx context.Context, cfg datastore.Config) (datastore.DataStore, error) {
	db, err := gorm.Open(mysqlgorm.Open(cfg.URL), &gorm.Config{
		NamingStrategy: sqlnamer.SQLNamer{},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}

	for _, v := range model.GetRegisterModels() {
		if err := db.WithContext(ctx).AutoMigrate(v); err != nil {
			return nil, err
		}
	}

	m := &mysql{
		Driver: sql.Driver{
			Client: *db.WithContext(ctx),
		},
	}
	return m, nil
}
