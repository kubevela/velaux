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

package api

import (
	"testing"

	"github.com/stretchr/testify/require"

	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

func TestValidateModifyClusterRequestAllowsLeavingOutTheKubeConfig(t *testing.T) {
	require.NoError(t, validateModifyClusterRequest(&apis.CreateClusterRequest{Name: "prod", Alias: "Prod"}))
	require.Error(t, validateModifyClusterRequest(&apis.CreateClusterRequest{Name: "Not A Name"}), "the other fields are still checked")
}
