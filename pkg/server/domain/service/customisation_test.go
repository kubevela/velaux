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

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/oam-dev/kubevela/apis/types"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func TestCustomisationRoundTrip(t *testing.T) {
	ctx := context.Background()
	cli := fake.NewClientBuilder().WithScheme(common2.Scheme).Build()
	svc := &customisationServiceImpl{KubeClient: cli}

	empty, err := svc.Get(ctx)
	require.NoError(t, err)
	assert.Equal(t, &apisv1.Customisation{}, empty, "no ConfigMap means the defaults")

	want := apisv1.Customisation{
		PageTitle:    "Guidewire Platform",
		LogoURL:      "https://example.com/logo.svg",
		SidebarColor: "#e6f1f6",
		AccentColor:  "#00739d",
		Terminology: map[string]apisv1.Term{
			"Environment": {Singular: "Stage", Plural: "Stages"},
			"Cluster":     {Singular: "Region", Plural: "Regions"},
		},
	}
	_, err = svc.Update(ctx, want)
	require.NoError(t, err)
	got, err := svc.Get(ctx)
	require.NoError(t, err)
	assert.Equal(t, &want, got)

	cm := &corev1.ConfigMap{}
	require.NoError(t, cli.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: CustomisationConfigMapName}, cm))
	assert.Equal(t, "https://example.com/logo.svg", cm.Data["logoURL"])
	assert.Equal(t, "#e6f1f6", cm.Data["sidebarColor"])
	assert.Equal(t, "Guidewire Platform", cm.Data["pageTitle"])
	assert.JSONEq(t, `{"Environment":{"singular":"Stage","plural":"Stages"},"Cluster":{"singular":"Region","plural":"Regions"}}`, cm.Data["terminology"])

	// A second update replaces the first, including dropping a term.
	_, err = svc.Update(ctx, apisv1.Customisation{Terminology: map[string]apisv1.Term{"Cluster": {Singular: "Region", Plural: "Regions"}}})
	require.NoError(t, err)
	got, err = svc.Get(ctx)
	require.NoError(t, err)
	assert.Empty(t, got.LogoURL)
	assert.Len(t, got.Terminology, 1)
}

func TestCustomisationRefusesWhatItCannotUse(t *testing.T) {
	svc := &customisationServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).Build()}
	for name, c := range map[string]apisv1.Customisation{
		"a logo that is no URL":   {LogoURL: "javascript:alert(1)"},
		"a colour that is no hex": {SidebarColor: "red; background: url(x)"},
		"a title over two lines":  {PageTitle: "one\ntwo"},
		"a term that is no word":  {Terminology: map[string]apisv1.Term{"cluster stuff": {Singular: "A", Plural: "B"}}},
		"a term with no singular": {Terminology: map[string]apisv1.Term{"Cluster": {Plural: "Regions"}}},
	} {
		_, err := svc.Update(context.Background(), c)
		assert.ErrorIs(t, err, bcode.ErrInvalidCustomisation, name)
	}
}
