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
	"sort"
	"strings"

	cuexv1alpha1 "github.com/kubevela/pkg/apis/cue/v1alpha1"
	cuexruntime "github.com/kubevela/pkg/cue/cuex/runtime"
	velacuex "github.com/oam-dev/kubevela/pkg/cue/cuex"
	"github.com/oam-dev/kubevela/pkg/workflow/providers"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// PackageService lists the CUE packages a definition can import: the Package
// resources in the cluster and the packages built into KubeVela.
type PackageService interface {
	ListPackages(ctx context.Context) ([]*apisv1.PackageBase, error)
	DetailPackage(ctx context.Context, namespace, name string) (*apisv1.PackageDetail, error)
	DetailBuiltinPackage(ctx context.Context, path, variant string) (*apisv1.PackageDetail, error)
}

type packageServiceImpl struct {
	KubeClient client.Client `inject:"kubeClient"`
}

// NewPackageService lists the CUE packages a definition can import.
func NewPackageService() PackageService {
	return &packageServiceImpl{}
}

// builtinPackage is a package built into KubeVela, with what can import it.
type builtinPackage struct {
	pkg    cuexruntime.Package
	usedBy []string
}

// builtinPackages are the packages built into the KubeVela this VelaUX is built
// against: those components, traits and sources compile with, and those
// workflow steps do. A path both import is one package where its templates are
// the same and two where they differ, each with what imports it. A running
// controller of another version may differ.
func builtinPackages() []builtinPackage {
	var out []builtinPackage
	add := func(pkgs []cuexruntime.Package, usedBy string) {
		for _, p := range pkgs {
			merged := false
			for i := range out {
				if out[i].pkg.GetPath() == p.GetPath() && sameTemplates(out[i].pkg, p) {
					out[i].usedBy = append(out[i].usedBy, usedBy)
					merged = true
				}
			}
			if !merged {
				out = append(out, builtinPackage{pkg: p, usedBy: []string{usedBy}})
			}
		}
	}
	add(velacuex.WorkloadPackages(), "components")
	add(providers.WorkflowPackages(), "workflow steps")
	sort.SliceStable(out, func(i, j int) bool { return out[i].pkg.GetPath() < out[j].pkg.GetPath() })
	return out
}

func sameTemplates(a, b cuexruntime.Package) bool {
	return strings.Join(a.GetTemplates(), "\x00") == strings.Join(b.GetTemplates(), "\x00")
}

// variant names what imports a built-in package, for its URL.
func (b builtinPackage) variant() string {
	return strings.ReplaceAll(strings.Join(b.usedBy, ","), " ", "-")
}

// builtinFiles names a built-in package's templates, which carry no file names.
func builtinFiles(p cuexruntime.Package) map[string]string {
	files := map[string]string{}
	for i, t := range p.GetTemplates() {
		name := p.GetName() + ".cue"
		if i > 0 {
			name = fmt.Sprintf("%s-%d.cue", p.GetName(), i+1)
		}
		files[name] = t
	}
	return files
}

func (s *packageServiceImpl) ListPackages(ctx context.Context) ([]*apisv1.PackageBase, error) {
	var list cuexv1alpha1.PackageList
	if err := s.KubeClient.List(ctx, &list); err != nil && !apierrors.IsNotFound(err) {
		return nil, err
	}
	sort.Slice(list.Items, func(i, j int) bool {
		a, b := list.Items[i], list.Items[j]
		return a.Spec.Path < b.Spec.Path || (a.Spec.Path == b.Spec.Path && a.Namespace+"/"+a.Name < b.Namespace+"/"+b.Name)
	})
	out := make([]*apisv1.PackageBase, 0, len(list.Items))
	for i := range list.Items {
		out = append(out, packageBase(&list.Items[i]))
	}
	for _, b := range builtinPackages() {
		out = append(out, builtinBase(b))
	}
	return out, nil
}

func (s *packageServiceImpl) DetailPackage(ctx context.Context, namespace, name string) (*apisv1.PackageDetail, error) {
	var pkg cuexv1alpha1.Package
	if err := s.KubeClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: name}, &pkg); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, bcode.ErrPackageNotExist
		}
		return nil, err
	}
	return packageDetail(packageBase(&pkg), pkg.Spec.Templates), nil
}

func (s *packageServiceImpl) DetailBuiltinPackage(_ context.Context, path, variant string) (*apisv1.PackageDetail, error) {
	for _, b := range builtinPackages() {
		if b.pkg.GetPath() == path && b.variant() == variant {
			return packageDetail(builtinBase(b), builtinFiles(b.pkg)), nil
		}
	}
	return nil, bcode.ErrPackageNotExist
}

func packageBase(pkg *cuexv1alpha1.Package) *apisv1.PackageBase {
	base := &apisv1.PackageBase{
		Name:       pkg.Name,
		Namespace:  pkg.Namespace,
		Path:       pkg.Spec.Path,
		Files:      len(pkg.Spec.Templates),
		CreateTime: &pkg.CreationTimestamp.Time,
	}
	if p := pkg.Spec.Provider; p != nil {
		base.Provider = &apisv1.PackageProvider{Protocol: string(p.Protocol), Endpoint: p.Endpoint}
		for k := range p.Header {
			base.Provider.Headers = append(base.Provider.Headers, k)
		}
		sort.Strings(base.Provider.Headers)
	}
	base.Functions = countFunctions(pkg.Spec.Templates)
	return base
}

func builtinBase(b builtinPackage) *apisv1.PackageBase {
	files := builtinFiles(b.pkg)
	return &apisv1.PackageBase{
		Name:      b.pkg.GetName(),
		Path:      b.pkg.GetPath(),
		Builtin:   true,
		UsedBy:    b.usedBy,
		Variant:   b.variant(),
		Files:     len(files),
		Functions: countFunctions(files),
	}
}

func countFunctions(files map[string]string) int {
	parsed, err := parsePackage(files)
	if err != nil {
		return 0
	}
	return len(parsed.functions)
}

// packageDetail reads what a package's files offer; files that do not parse
// are still listed, with why.
func packageDetail(base *apisv1.PackageBase, files map[string]string) *apisv1.PackageDetail {
	detail := &apisv1.PackageDetail{PackageBase: *base, Functions: []*apisv1.PackageFunction{}, Types: []*apisv1.PackageType{}}
	names := make([]string, 0, len(files))
	for name := range files {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		detail.FileList = append(detail.FileList, &apisv1.PackageFile{Name: name, Content: files[name]})
	}
	parsed, err := parsePackage(files)
	if err != nil {
		klog.V(4).Infof("package %s does not parse: %v", base.Path, err)
		detail.Issue = err.Error()
		return detail
	}
	detail.PackageName = parsed.name
	detail.Functions = append(detail.Functions, parsed.functions...)
	detail.Types = append(detail.Types, parsed.types...)
	return detail
}
