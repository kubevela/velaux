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
	"fmt"
	"testing"

	cuexv1alpha1 "github.com/kubevela/pkg/apis/cue/v1alpha1"
	common2 "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

func packageService(t *testing.T) *packageServiceImpl {
	t.Helper()
	pkg := &cuexv1alpha1.Package{
		ObjectMeta: metav1.ObjectMeta{Name: "mysql", Namespace: "vela-system"},
		Spec: cuexv1alpha1.PackageSpec{
			Path: "ext/db/mysql",
			Provider: &cuexv1alpha1.Provider{
				Protocol: cuexv1alpha1.ProtocolHTTP,
				Endpoint: "https://render/mysql",
				Header:   map[string]string{"Authorization": "Bearer secret"},
			},
			Templates: map[string]string{"mysql.cue": mysqlTemplate},
		},
	}
	return &packageServiceImpl{KubeClient: fake.NewClientBuilder().WithScheme(common2.Scheme).WithObjects(pkg).Build()}
}

func TestListPackages(t *testing.T) {
	list, err := packageService(t).ListPackages(context.Background())
	require.NoError(t, err)

	byPath := map[string]int{}
	for i, p := range list {
		byPath[p.Path] = i
	}
	require.Contains(t, byPath, "ext/db/mysql")
	mysql := list[byPath["ext/db/mysql"]]
	assert.Equal(t, "vela-system", mysql.Namespace)
	assert.False(t, mysql.Builtin)
	assert.Equal(t, 1, mysql.Functions)
	assert.Equal(t, 1, mysql.Files)
	require.NotNil(t, mysql.Provider)
	assert.Equal(t, []string{"Authorization"}, mysql.Provider.Headers, "header names, never their values")

	assert.Equal(t, 0, byPath["ext/db/mysql"], "Package resources come before the built-ins")

	// vela/kube is two packages: the one components import and the one
	// workflow steps do. vela/helm is the same for both, so it is one.
	var kube, helm []*apisv1.PackageBase
	for _, p := range list {
		switch p.Path {
		case "vela/kube":
			kube = append(kube, p)
		case "vela/helm":
			helm = append(helm, p)
		}
	}
	require.Len(t, kube, 2)
	assert.Equal(t, []string{"components"}, kube[0].UsedBy)
	assert.Equal(t, []string{"workflow steps"}, kube[1].UsedBy)
	assert.NotEqual(t, kube[0].Variant, kube[1].Variant)
	require.Len(t, helm, 1)
	assert.Equal(t, []string{"components", "workflow steps"}, helm[0].UsedBy)
}

func TestDetailPackage(t *testing.T) {
	svc := packageService(t)
	detail, err := svc.DetailPackage(context.Background(), "vela-system", "mysql")
	require.NoError(t, err)
	assert.Equal(t, "mysql", detail.PackageName)
	require.Len(t, detail.Functions, 1)
	assert.Equal(t, "#ListTables", detail.Functions[0].Name)
	require.Len(t, detail.FileList, 1)
	assert.Equal(t, "mysql.cue", detail.FileList[0].Name)

	builtin, err := svc.DetailBuiltinPackage(context.Background(), "vela/kube", "workflow-steps")
	require.NoError(t, err)
	assert.Equal(t, []string{"workflow steps"}, builtin.UsedBy)
	assert.True(t, builtin.Builtin)
	assert.NotNil(t, builtin.Types, "a package without types still lists them, empty")
	assert.NotEmpty(t, builtin.Functions)
	assert.Empty(t, builtin.Issue)

	_, err = svc.DetailPackage(context.Background(), "vela-system", "nope")
	assert.ErrorIs(t, err, bcode.ErrPackageNotExist)
	_, err = svc.DetailBuiltinPackage(context.Background(), "vela/nope", "components")
	assert.ErrorIs(t, err, bcode.ErrPackageNotExist)
}

// Every package built into KubeVela reads, so none is listed without its functions.
func TestBuiltinPackagesParse(t *testing.T) {
	for _, b := range builtinPackages() {
		detail := packageDetail(builtinBase(b), builtinFiles(b.pkg))
		assert.Empty(t, detail.Issue, b.pkg.GetPath())
		t.Logf("%-22s %-28s functions=%d types=%d", b.pkg.GetPath(), fmt.Sprint(b.usedBy), len(detail.Functions), len(detail.Types))
	}
}
