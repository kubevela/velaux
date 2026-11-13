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

package service

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/kubevela/velaux/pkg/server/domain/model"
)

func TestTheAppSearchMatchesNameAliasOrDescription(t *testing.T) {
	app := &model.Application{Name: "shop-frontend", Alias: "Shop Front", Description: "Serves the storefront"}
	for query, want := range map[string]bool{
		"":           true,
		"frontend":   true,
		"Shop Front": true,
		"storefront": true,
		"SHOP":       true,
		"payments":   false,
	} {
		require.Equal(t, want, matchesQuery(app, query), "query %q", query)
	}
}
