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

package registry

import (
	"context"

	plugins "github.com/kubevela/velaux/pkg/plugin/types"
)

// Pool is responsible for the internal storing and retrieval of plugins.
type Pool interface {
	// Plugin finds a plugin by its ID.
	Plugin(ctx context.Context, id string) (*plugins.Plugin, bool)
	// Plugins returns all plugins.
	Plugins(ctx context.Context) []*plugins.Plugin
	// Add adds the provided plugin to the registry.
	Add(ctx context.Context, plugin *plugins.Plugin) error
	// Remove deletes the requested plugin from the registry.
	Remove(ctx context.Context, id string) error
}
