/*
Copyright 2023 The KubeVela Authors.

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
	RegisterModel(&PluginSetting{})
}

// PluginSetting save the setting data of the plugin
type PluginSetting struct {
	BaseModel
	ID             string                 `json:"id" gorm:"primaryKey"`
	Enabled        bool                   `json:"enabled"`
	JSONData       map[string]interface{} `json:"jsonData" gorm:"serializer:json"`
	SecureJSONData map[string]interface{} `json:"secureJsonData" gorm:"serializer:json"`
}

// PrimaryKey return custom primary key
func (p PluginSetting) PrimaryKey() string {
	return p.ID
}

// TableName return custom table name
func (p PluginSetting) TableName() string {
	return tableNamePrefix + "plugin"
}

// ShortTableName is the compressed version of table name for kubeapi storage and others
func (p PluginSetting) ShortTableName() string {
	return "plugin"
}

// Index return custom index
func (p PluginSetting) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if p.ID != "" {
		index["id"] = p.ID
	}
	return index
}
