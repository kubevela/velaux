/*
Copyright 2026 The KubeVela Authors.

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

package sql

import (
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"k8s.io/klog/v2"
)

// WidenPrimaryKey adds the model's missing key columns to its table's primary key. GORM's
// AutoMigrate creates a primary key but never changes one, so a table created before a key
// column was added to the model keeps the narrower key. Only widening is done: rows unique
// on fewer columns stay unique on more, so it cannot fail on existing data. The added
// columns take the model's key type first, since MySQL cannot key on a TEXT column.
func WidenPrimaryKey(db *gorm.DB, model interface{}) error {
	stmt := &gorm.Statement{DB: db}
	if err := stmt.Parse(model); err != nil {
		return err
	}
	want := stmt.Schema.PrimaryFieldDBNames
	columns, err := db.Migrator().ColumnTypes(model)
	if err != nil {
		return err
	}
	have := map[string]bool{}
	for _, c := range columns {
		if pk, ok := c.PrimaryKey(); ok && pk {
			have[c.Name()] = true
		}
	}
	if len(have) == 0 || len(have) >= len(want) {
		return nil
	}
	for name := range have {
		if !contains(want, name) {
			return nil
		}
	}

	for _, name := range want {
		if !have[name] {
			if err := db.Migrator().AlterColumn(model, name); err != nil {
				return fmt.Errorf("change key column %s.%s to the model's type: %w", stmt.Schema.Table, name, err)
			}
		}
	}

	table := stmt.Schema.Table
	keys := make([]clause.Column, 0, len(want))
	for _, name := range want {
		keys = append(keys, clause.Column{Name: name})
	}
	switch db.Name() {
	case "mysql":
		err = db.Exec("ALTER TABLE ? DROP PRIMARY KEY, ADD PRIMARY KEY ?", clause.Table{Name: table}, keys).Error
	case "postgres":
		var constraint string
		err = db.Raw("SELECT constraint_name FROM information_schema.table_constraints"+
			" WHERE table_schema = current_schema() AND table_name = ? AND constraint_type = 'PRIMARY KEY'", table).
			Scan(&constraint).Error
		if err == nil {
			err = db.Exec("ALTER TABLE ? DROP CONSTRAINT ?, ADD PRIMARY KEY ?",
				clause.Table{Name: table}, clause.Column{Name: constraint}, keys).Error
		}
	default:
		return nil
	}
	if err != nil {
		return fmt.Errorf("widen the primary key of %s to %v: %w", table, want, err)
	}
	klog.Infof("widened the primary key of %s to %v", table, want)
	return nil
}

func contains(names []string, name string) bool {
	for _, n := range names {
		if n == name {
			return true
		}
	}
	return false
}
