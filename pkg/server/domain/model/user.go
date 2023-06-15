/*
Copyright 2022 The KubeVela Authors.

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

import (
	"fmt"
	"time"

	"github.com/form3tech-oss/jwt-go"
)

func init() {
	RegisterModel(&User{})
	RegisterModel(&ProjectUser{})
	RegisterModel(&Role{})
	RegisterModel(&Permission{})
	RegisterModel(&PermissionTemplate{})
}

// DefaultAdminUserAlias default admin user alias
const DefaultAdminUserAlias = "Administrator"

// RoleAdmin admin role
const RoleAdmin = "admin"

// User is the model of user
type User struct {
	BaseModel
	Name          string    `json:"name" gorm:"primaryKey"`
	Email         string    `json:"email"`
	Alias         string    `json:"alias,omitempty"`
	Password      string    `json:"password,omitempty"`
	Disabled      bool      `json:"disabled"`
	LastLoginTime time.Time `json:"lastLoginTime,omitempty" gorm:"default:'2020-01-01'"`
	// UserRoles binding the platform level roles
	UserRoles []string `json:"userRoles" gorm:"serializer:json"`
	DexSub    string   `json:"dexSub,omitempty"`
}

// TableName return custom table name
func (u *User) TableName() string {
	return tableNamePrefix + "user"
}

// ShortTableName return custom table name
func (u *User) ShortTableName() string {
	return "usr"
}

// PrimaryKey return custom primary key
func (u *User) PrimaryKey() string {
	return u.Name
}

// Index return custom index
func (u *User) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if u.Name != "" {
		index["name"] = u.Name
	}
	if u.Email != "" {
		index["email"] = u.Email
	}
	if u.DexSub != "" {
		index["dexSub"] = u.DexSub
	}
	return index
}

// IsAdmin return if the user have admin role
func (u *User) IsAdmin() bool {
	for _, role := range u.UserRoles {
		if role == RoleAdmin {
			return true
		}
	}
	return false
}

// ProjectUser is the model of user in project
type ProjectUser struct {
	BaseModel
	Username    string `json:"username" gorm:"primaryKey"`
	ProjectName string `json:"projectName" gorm:"primaryKey"`
	// UserRoles binding the project level roles
	UserRoles []string `json:"userRoles" gorm:"serializer:json"`
}

// TableName return custom table name
func (u *ProjectUser) TableName() string {
	return tableNamePrefix + "project_user"
}

// ShortTableName return custom table name
func (u *ProjectUser) ShortTableName() string {
	return "pusr"
}

// PrimaryKey return custom primary key
func (u *ProjectUser) PrimaryKey() string {
	return fmt.Sprintf("%s-%s", u.ProjectName, u.Username)
}

// Index return custom index
func (u *ProjectUser) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if u.Username != "" {
		index["username"] = u.Username
	}
	if u.ProjectName != "" {
		index["projectName"] = u.ProjectName
	}
	return index
}

// CustomClaims is the custom claims
type CustomClaims struct {
	Username  string `json:"username"`
	GrantType string `json:"grantType"`
	jwt.StandardClaims
}

// Role is a model for a new RBAC mode.
type Role struct {
	BaseModel
	Name        string   `json:"name" gorm:"primaryKey"`
	Alias       string   `json:"alias"`
	Project     string   `json:"project,omitempty"`
	Permissions []string `json:"permissions" gorm:"serializer:json"`
}

// Permission is a model for a new RBAC mode.
type Permission struct {
	BaseModel
	Name      string   `json:"name" gorm:"primaryKey"`
	Alias     string   `json:"alias"`
	Project   string   `json:"project,omitempty" gorm:"primaryKey"`
	Resources []string `json:"resources" gorm:"serializer:json"`
	Actions   []string `json:"actions" gorm:"serializer:json"`
	// Effect option values: Allow,Deny
	Effect    string     `json:"effect"`
	Principal *Principal `json:"principal,omitempty" gorm:"serializer:json"`
	Condition *Condition `json:"condition,omitempty" gorm:"serializer:json"`
}

// Principal is a model for a new RBAC mode.
type Principal struct {
	// Type options: User or Role
	Type  string   `json:"type"`
	Names []string `json:"names"`
}

// Condition is a model for a new RBAC mode.
type Condition struct {
}

// TableName return custom table name
func (r *Role) TableName() string {
	return tableNamePrefix + "role"
}

// ShortTableName return custom table name
func (r *Role) ShortTableName() string {
	return "role"
}

// PrimaryKey return custom primary key
func (r *Role) PrimaryKey() string {
	if r.Project == "" {
		return r.Name
	}
	return fmt.Sprintf("%s-%s", r.Project, r.Name)
}

// Index return custom index
func (r *Role) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if r.Name != "" {
		index["name"] = r.Name
	}
	if r.Project != "" {
		index["project"] = r.Project
	}
	return index
}

// TableName return custom table name
func (p *Permission) TableName() string {
	return tableNamePrefix + "perm"
}

// ShortTableName return custom table name
func (p *Permission) ShortTableName() string {
	return "perm"
}

// PrimaryKey return custom primary key
func (p *Permission) PrimaryKey() string {
	if p.Project == "" {
		return p.Name
	}
	return fmt.Sprintf("%s-%s", p.Project, p.Name)
}

// Index return custom index
func (p *Permission) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if p.Name != "" {
		index["name"] = p.Name
	}
	if p.Project != "" {
		index["project"] = p.Project
	}
	if p.Principal != nil && p.Principal.Type != "" {
		index["principal.type"] = p.Principal.Type
	}
	return index
}

// PermissionTemplate is a model for a new RBAC mode.
type PermissionTemplate struct {
	BaseModel
	Name  string `json:"name" gorm:"primaryKey"`
	Alias string `json:"alias"`
	// Scope options: project or platform
	Scope     string     `json:"scope"`
	Resources []string   `json:"resources" gorm:"serializer:json"`
	Actions   []string   `json:"actions" gorm:"serializer:json"`
	Effect    string     `json:"effect"`
	Condition *Condition `json:"condition,omitempty" gorm:"serializer:json"`
}

// TableName return custom table name
func (p *PermissionTemplate) TableName() string {
	return tableNamePrefix + "perm_temp"
}

// ShortTableName return custom table name
func (p *PermissionTemplate) ShortTableName() string {
	return "perm_temp"
}

// PrimaryKey return custom primary key
func (p *PermissionTemplate) PrimaryKey() string {
	return p.Name
}

// Index return custom index
func (p *PermissionTemplate) Index() map[string]interface{} {
	index := make(map[string]interface{})
	if p.Name != "" {
		index["name"] = p.Name
	}
	if p.Scope != "" {
		index["scope"] = p.Scope
	}
	return index
}
