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
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	pkgdef "github.com/oam-dev/kubevela/pkg/definition"
	"github.com/oam-dev/kubevela/pkg/workflow/providers"
	"github.com/oam-dev/kubevela/references/docgen"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// exampleTimeout and exampleLimit bound fetching a definition's example-url.
const (
	exampleTimeout = 5 * time.Second
	exampleLimit   = 256 << 10
)

// DefinitionDoc is a definition's reference documentation, as KubeVela
// generates it for kubevela.io and `vela show`: its description, an example,
// and its parameters as tables. lang is en or zh.
func (d *definitionServiceImpl) DefinitionDoc(ctx context.Context, name, defType, lang string) (*apisv1.DefinitionDocResponse, error) {
	capability, exampleURL, err := d.capabilityOf(ctx, name, defType)
	if err != nil {
		return nil, err
	}
	if exampleURL != "" {
		capability.Example = fetchExample(ctx, exampleURL)
	}
	ref := &docgen.MarkdownReference{Compiler: providers.DefaultCompiler.Get()}
	ref.Client = d.KubeClient
	ref.I18N = &docgen.En
	if lang == "zh" {
		ref.I18N = &docgen.Zh
	}
	// docgen's Markdown takes no sources: a source is written as a policy,
	// which adds nothing of its own to the description and parameters, and its
	// outputs, cache and surfaces follow.
	if capability.Type == types.TypeSource && len(capability.Parameters) == 0 {
		// A source with nothing to bind has no specification to show.
		doc := fmt.Sprintf("## %s\n\n%s\n\n%s", ref.I18N.Get("Description"), capability.Description, sourceSections(*capability, ref.I18N))
		return &apisv1.DefinitionDocResponse{Markdown: doc}, nil
	}
	written := *capability
	if written.Type == types.TypeSource {
		written.Type = types.TypePolicy
	}
	doc, err := ref.GenerateMarkdownForCap(ctx, written, false)
	if err != nil {
		return nil, bcode.ErrDefinitionDocUnavailable.SetMessage(err.Error())
	}
	doc = withoutFrontMatter(doc)
	if capability.Type == types.TypeSource {
		doc = strings.TrimRight(doc, "\n") + "\n\n" + sourceSections(*capability, ref.I18N)
	}
	return &apisv1.DefinitionDocResponse{Markdown: doc}, nil
}

// sourceSections documents what a source adds to a definition: the values it
// returns, how it caches them, and where an Application may read it, as
// vela def show prints them.
func sourceSections(c types.Capability, lang *docgen.I18n) string {
	var b strings.Builder
	if len(c.SourceOutputs) > 0 {
		fmt.Fprintf(&b, "## %s\n\n| %s | %s | %s |\n| --- | --- | --- |\n", lang.Get("Outputs"), lang.Get("Name"), lang.Get("Description"), lang.Get("Type"))
		for _, o := range c.SourceOutputs {
			fmt.Fprintf(&b, "| %s | %s | %s |\n", o.Name, markdownCell(o.Usage), o.Type.String())
		}
		b.WriteString("\n")
	}
	if len(c.SourceStorage) > 0 {
		fmt.Fprintf(&b, "## %s\n\n| %s | %s |\n| --- | --- |\n", lang.Get("Cache"), lang.Get("Name"), lang.Get("Value"))
		for _, f := range c.SourceStorage {
			fmt.Fprintf(&b, "| %s | `%s` |\n", f.Name, f.Value)
		}
		b.WriteString("\n")
	}
	if len(c.SourceSurfaces) > 0 {
		fmt.Fprintf(&b, "## %s\n\n| %s | %s | %s |\n| --- | --- | --- |\n", lang.Get("Consumable from"), lang.Get("Surface"), lang.Get("Consumable"), lang.Get("Reason"))
		for _, sfc := range c.SourceSurfaces {
			mark := "✘"
			if sfc.Consumable {
				mark = "✔"
			}
			fmt.Fprintf(&b, "| %s | %s | %s |\n", sfc.Name, mark, markdownCell(sfc.Reason))
		}
	}
	return b.String()
}

// markdownCell keeps text on one table row: pipes are escaped, newlines joined.
func markdownCell(s string) string {
	return strings.ReplaceAll(strings.ReplaceAll(s, "|", "\\|"), "\n", " ")
}

// withoutFrontMatter drops the Docusaurus front matter docgen writes for
// kubevela.io: the page it is shown on already names the definition.
func withoutFrontMatter(doc string) string {
	if !strings.HasPrefix(doc, "---\n") {
		return doc
	}
	if end := strings.Index(doc[4:], "\n---\n"); end >= 0 {
		return strings.TrimLeft(doc[4+end+5:], "\n")
	}
	return doc
}

// DefinitionCUE is a definition as CUE, as vela def get writes it: the file
// it is authored as, with its metadata and template.
func (d *definitionServiceImpl) DefinitionCUE(ctx context.Context, name, defType string) (*apisv1.DefinitionCUEResponse, error) {
	apiVersion, kind, err := getKindAndVersion(defType)
	if err != nil {
		return nil, err
	}
	def := pkgdef.Definition{}
	def.SetAPIVersion(apiVersion)
	def.SetKind(kind)
	if err := d.KubeClient.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: name}, &def.Unstructured); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, bcode.ErrDefinitionNotFound
		}
		return nil, err
	}
	text, err := def.ToCUEString()
	if err != nil {
		return nil, bcode.ErrDefinitionDocUnavailable.SetMessage(err.Error())
	}
	return &apisv1.DefinitionCUEResponse{CUE: text}, nil
}

// capabilityOf reads a definition as docgen's capability, with its
// example-url taken out: docgen would fetch it with no bound, so the caller
// fetches it instead.
func (d *definitionServiceImpl) capabilityOf(ctx context.Context, name, defType string) (*types.Capability, string, error) {
	key := client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: name}
	get := func(obj client.Object) (string, error) {
		if err := d.KubeClient.Get(ctx, key, obj); err != nil {
			if apierrors.IsNotFound(err) {
				return "", bcode.ErrDefinitionNotFound
			}
			return "", err
		}
		annotations := obj.GetAnnotations()
		exampleURL := annotations[types.AnnoDefinitionExampleURL]
		delete(annotations, types.AnnoDefinitionExampleURL)
		obj.SetAnnotations(annotations)
		return exampleURL, nil
	}
	var (
		capability *types.Capability
		exampleURL string
		err        error
	)
	switch defType {
	case "component":
		def := &v1beta1.ComponentDefinition{}
		if exampleURL, err = get(def); err == nil {
			capability, err = docgen.GetCapabilityByComponentDefinitionObject(*def, def.Spec.Workload.Type)
		}
	case "trait":
		def := &v1beta1.TraitDefinition{}
		if exampleURL, err = get(def); err == nil {
			capability, err = docgen.GetCapabilityByTraitDefinitionObject(*def)
		}
	case "workflowstep":
		def := &v1beta1.WorkflowStepDefinition{}
		if exampleURL, err = get(def); err == nil {
			capability, err = docgen.GetCapabilityByWorkflowStepDefinitionObject(*def)
		}
	case "policy":
		def := &v1beta1.PolicyDefinition{}
		if exampleURL, err = get(def); err == nil {
			capability, err = docgen.GetCapabilityByPolicyDefinitionObject(*def)
		}
	case "source":
		def := &v1beta1.SourceDefinition{}
		if exampleURL, err = get(def); err == nil {
			capability, err = docgen.GetCapabilityBySourceDefinitionObject(*def)
		}
	default:
		return nil, "", bcode.ErrDefinitionDocUnavailable.SetMessage(fmt.Sprintf("no documentation is generated for %s definitions", defType))
	}
	if err != nil {
		return nil, "", err
	}
	return capability, exampleURL, nil
}

// fetchExample reads a definition's example the way docgen does, a YAML file
// fenced as such, within exampleTimeout and exampleLimit. An example that
// cannot be read is left out.
func fetchExample(ctx context.Context, raw string) string {
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return ""
	}
	ctx, cancel := context.WithTimeout(ctx, exampleTimeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	if err != nil {
		return ""
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return ""
	}
	defer func() { _ = res.Body.Close() }()
	if res.StatusCode != http.StatusOK {
		return ""
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, exampleLimit))
	if err != nil {
		return ""
	}
	if strings.HasSuffix(u.Path, ".yaml") {
		return fmt.Sprintf("```yaml\n%s\n```", data)
	}
	return string(data)
}
