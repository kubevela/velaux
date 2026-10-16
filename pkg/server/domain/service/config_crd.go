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
	"encoding/json"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	configv1alpha1 "github.com/oam-dev/kubevela/apis/config.oam.dev/v1alpha1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/config"

	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// templateCRs lists the ConfigTemplates in a namespace a config may be written
// from. A SourceDefinition's generated template validates that source's cache
// and is no config anybody writes, so it is left out.
func (u *configServiceImpl) templateCRs(ctx context.Context, namespace, scope string) ([]*apis.ConfigTemplate, error) {
	var list configv1alpha1.ConfigTemplateList
	if err := u.KubeClient.List(ctx, &list, client.InNamespace(namespace)); err != nil {
		if meta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, err
	}
	var templates []*apis.ConfigTemplate
	for _, ct := range list.Items {
		if _, generated := ct.Labels[types.LabelSourceDefinitionName]; generated {
			continue
		}
		if !scopeMatches(string(ct.Spec.Scope), scope) {
			continue
		}
		alias := ct.Spec.Alias
		if alias == "" {
			alias = ct.Name
		}
		templates = append(templates, &apis.ConfigTemplate{
			Alias:       alias,
			Name:        ct.Name,
			Namespace:   ct.Namespace,
			Description: ct.Spec.Description,
			Scope:       string(ct.Spec.Scope),
			Sensitive:   ct.Spec.Sensitive,
			CreateTime:  ct.CreationTimestamp.Time,
		})
	}
	return templates, nil
}

// scopeMatches reports whether a ConfigTemplate's scope answers a query for
// scope; a legacy template's "project" is the CRD's "namespace".
func scopeMatches(templateScope, scope string) bool {
	return scope == "" || templateScope == scope ||
		(scope == configScopeProject && templateScope == string(configv1alpha1.ConfigTemplateScopeNamespace))
}

// templateCR reads the ConfigTemplate a config names, or nil where the template
// is a legacy ConfigMap.
func (u *configServiceImpl) templateCR(ctx context.Context, name config.NamespacedName) (*configv1alpha1.ConfigTemplate, error) {
	if name.Namespace == "" {
		name.Namespace = GlobalConfigNamespace
	}
	ct := &configv1alpha1.ConfigTemplate{}
	if err := u.KubeClient.Get(ctx, client.ObjectKey{Namespace: name.Namespace, Name: name.Name}, ct); err != nil {
		if apierrors.IsNotFound(err) || meta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, err
	}
	return ct, nil
}

// configCR reads a Config, or nil where the config is a legacy Secret.
func (u *configServiceImpl) configCR(ctx context.Context, namespace, name string) (*configv1alpha1.Config, error) {
	c := &configv1alpha1.Config{}
	if err := u.KubeClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: name}, c); err != nil {
		if apierrors.IsNotFound(err) || meta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, err
	}
	return c, nil
}

// configCRs lists the Configs in a namespace, of the named template when one is given.
func (u *configServiceImpl) configCRs(ctx context.Context, namespace, template string) ([]configv1alpha1.Config, error) {
	var list configv1alpha1.ConfigList
	if err := u.KubeClient.List(ctx, &list, client.InNamespace(namespace)); err != nil {
		if meta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, err
	}
	var out []configv1alpha1.Config
	for _, c := range list.Items {
		// A source's cached value is stored as a Config; it is not one anyone wrote.
		if _, cached := c.Labels[types.LabelSourceDefinitionName]; cached {
			continue
		}
		if template == "" || (c.Spec.TemplateRef != nil && c.Spec.TemplateRef.Name == template) {
			out = append(out, c)
		}
	}
	return out, nil
}

// validateConfigCR renders the properties against the template, so a value the
// template refuses is refused here rather than in the Config's status.
func (u *configServiceImpl) validateConfigCR(ctx context.Context, ct *configv1alpha1.ConfigTemplate, name, namespace string, properties map[string]interface{}) error {
	if ct.Spec.Sensitive {
		return bcode.ErrSensitiveConfigTemplate
	}
	_, err := u.Factory.ParseConfig(ctx, config.NamespacedName{Name: ct.Name, Namespace: ct.Namespace}, config.Metadata{
		NamespacedName: config.NamespacedName{Name: name, Namespace: namespace},
		Properties:     properties,
	})
	return err
}

// writeConfigCR creates or updates a Config of a ConfigTemplate.
func (u *configServiceImpl) writeConfigCR(ctx context.Context, ct *configv1alpha1.ConfigTemplate, existing *configv1alpha1.Config,
	name, namespace, alias, description string, properties map[string]interface{}) (*configv1alpha1.Config, error) {
	raw, err := json.Marshal(properties)
	if err != nil {
		return nil, err
	}
	c := existing
	if c == nil {
		c = &configv1alpha1.Config{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}}
		// Only on create: the Config webhook refuses any change to templateRef,
		// including spelling out a namespace it left to the default.
		c.Spec.TemplateRef = &configv1alpha1.ConfigTemplateReference{Name: ct.Name, Namespace: ct.Namespace}
	}
	c.Spec.Properties = &runtime.RawExtension{Raw: raw}
	c.Spec.Alias, c.Spec.Description = alias, description
	if existing == nil {
		err = u.KubeClient.Create(ctx, c)
	} else {
		err = u.KubeClient.Update(ctx, c)
	}
	return c, err
}

func convertConfigCR(project string, c configv1alpha1.Config, withProperties bool) *apis.Config {
	created := c.CreationTimestamp.Time
	out := &apis.Config{
		Name:        c.Name,
		Namespace:   c.Namespace,
		Project:     project,
		Alias:       c.Spec.Alias,
		Description: c.Spec.Description,
		CreatedTime: &created,
		Phase:       string(c.Status.Phase),
	}
	if c.Spec.TemplateRef != nil {
		out.Template = config.NamespacedName{Name: c.Spec.TemplateRef.Name, Namespace: c.Spec.TemplateRef.Namespace}
	}
	for _, cond := range c.Status.Conditions {
		if cond.Message != "" {
			out.Message = cond.Message
		}
	}
	if withProperties && c.Spec.Properties != nil && len(c.Spec.Properties.Raw) > 0 {
		properties := map[string]interface{}{}
		if err := json.Unmarshal(c.Spec.Properties.Raw, &properties); err == nil {
			out.Properties = properties
		}
	}
	return out
}

// updateConfigCR replaces a Config's properties, alias and description.
func (u *configServiceImpl) updateConfigCR(ctx context.Context, project string, c *configv1alpha1.Config, req apis.UpdateConfigRequest) (*apis.Config, error) {
	var properties = make(map[string]interface{})
	if err := json.Unmarshal([]byte(req.Properties), &properties); err != nil {
		return nil, err
	}
	if c.Spec.TemplateRef == nil {
		return nil, bcode.ErrTemplateNotFound
	}
	ct, err := u.templateCR(ctx, config.NamespacedName{Name: c.Spec.TemplateRef.Name, Namespace: c.Spec.TemplateRef.Namespace})
	if err != nil {
		return nil, err
	}
	if ct == nil {
		return nil, bcode.ErrTemplateNotFound
	}
	if err := u.validateConfigCR(ctx, ct, c.Name, c.Namespace, properties); err != nil {
		return nil, err
	}
	updated, err := u.writeConfigCR(ctx, ct, c, c.Name, c.Namespace, req.Alias, req.Description, properties)
	if err != nil {
		return nil, err
	}
	return convertConfigCR(project, *updated, true), nil
}
