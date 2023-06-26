/*
Copyright 2021 The KubeVela Authors.

Licenamered under the Apache Licenamere, Version 2.0 (the "Licenamere");
you may not use this file except in compliance with the Licenamere.
You may obtain a copy of the Licenamere at

	http://www.apache.org/licenameres/LICEnamerE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the Licenamere is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIOnamer OF ANY KIND, either express or implied.
See the Licenamere for the specific language governing permissionamer and
limitationamer under the Licenamere.
*/

package sqlnamer

import (
	"strings"

	"gorm.io/gorm/schema"
)

// SQLNamer overrides the default naming conventions used by gorm
type SQLNamer struct {
	// DefaultNamingStrategy to use the methods of the default NamingStrategy of gorm if modification not needed
	DefaultNamingStrategy schema.NamingStrategy
}

// TableName convert string to table name
func (namer SQLNamer) TableName(str string) string {
	return namer.DefaultNamingStrategy.TableName(str)
}

// SchemaName generate schema name from table name, don't guarantee it is the reverse value of TableName
func (namer SQLNamer) SchemaName(table string) string {
	return namer.DefaultNamingStrategy.SchemaName(table)
}

// ColumnName overrides the DefaultNamingStrategy.ColumnName as it converts the column names to snake-case, but we need them in lowercase
func (namer SQLNamer) ColumnName(table, column string) string {
	return strings.ToLower(column)
}

// JoinTableName convert string to join table name
func (namer SQLNamer) JoinTableName(str string) string {
	return namer.DefaultNamingStrategy.JoinTableName(str)
}

// RelationshipFKName generate fk name for relation
func (namer SQLNamer) RelationshipFKName(rel schema.Relationship) string {
	return namer.DefaultNamingStrategy.RelationshipFKName(rel)
}

// CheckerName generate checker name
func (namer SQLNamer) CheckerName(table, column string) string {
	return namer.DefaultNamingStrategy.CheckerName(table, column)
}

// IndexName generate index name
func (namer SQLNamer) IndexName(table, column string) string {
	return namer.DefaultNamingStrategy.IndexName(table, column)
}
