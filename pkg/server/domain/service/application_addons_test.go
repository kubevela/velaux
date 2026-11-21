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

	"github.com/stretchr/testify/assert"

	"github.com/kubevela/velaux/pkg/server/domain/model"
)

func TestAddonFilter(t *testing.T) {
	addonApp := &model.Application{Name: "addon-fluxcd", Labels: map[string]string{model.LabelSyncAddon: "fluxcd"}}
	service := &model.Application{Name: "orders"}

	assert.True(t, addonFilter(addonApp, ""), "every application by default")
	assert.True(t, addonFilter(service, ""))
	assert.False(t, addonFilter(addonApp, "exclude"), "Services leave out what addons install")
	assert.True(t, addonFilter(service, "exclude"))
	assert.True(t, addonFilter(addonApp, "only"), "the Addons page lists them alone")
	assert.False(t, addonFilter(service, "only"))
}
