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

package model

func init() {
	RegisterModel(&Migration{})
}

// Migration records a change to existing data VelaUX has made, so it is made
// once: what it changed is the admins' afterwards.
type Migration struct {
	BaseModel
	Name string `json:"name" gorm:"primaryKey"`
}

// TableName return custom table name
func (m *Migration) TableName() string {
	return tableNamePrefix + "migration"
}

// ShortTableName is the compressed version of table name for kubeapi storage and others
func (m *Migration) ShortTableName() string {
	return "mig"
}

// PrimaryKey return custom primary key
func (m *Migration) PrimaryKey() string {
	return m.Name
}

// Index return custom index
func (m *Migration) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if m.Name != "" {
		index["name"] = m.Name
	}
	return index
}
