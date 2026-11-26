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
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func TestAWriteStaysInTheProjectItWasAuthorizedFor(t *testing.T) {
	authorizedFor := func(project string) context.Context { return utils.WithProject(context.Background(), project) }

	require.NoError(t, requireAuthorizedProject(authorizedFor("shop"), "shop"))
	require.ErrorIs(t, requireAuthorizedProject(authorizedFor("shop"), "payments"), bcode.ErrProjectNotAuthorized)
	require.NoError(t, requireAuthorizedProject(authorizedFor(""), "payments"),
		"authorized with no project means a permission over every project")
	require.NoError(t, requireAuthorizedProject(context.Background(), "payments"),
		"a call no request filter authorized, such as the server's own, is not limited")
}

// Both creates refuse before they touch the store, so a nil service is enough to show it.
func TestCreatesRefuseABodyProjectTheyWereNotAuthorizedFor(t *testing.T) {
	ctx := utils.WithProject(context.Background(), "shop")
	_, err := (&applicationServiceImpl{}).CreateApplication(ctx, apisv1.CreateApplicationRequest{Name: "web", Project: "payments"})
	require.ErrorIs(t, err, bcode.ErrProjectNotAuthorized)
	_, err = (&envServiceImpl{}).CreateEnv(ctx, apisv1.CreateEnvRequest{Name: "prod", Project: "payments"})
	require.ErrorIs(t, err, bcode.ErrProjectNotAuthorized)
}
