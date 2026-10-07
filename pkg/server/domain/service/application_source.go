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

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/klog/v2"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// ListSources lists the sources of an application, in the order they are declared.
func (c *applicationServiceImpl) ListSources(_ context.Context, app *model.Application) []*apisv1.SourceBase {
	sources := []*apisv1.SourceBase{}
	for _, s := range app.Sources {
		sources = append(sources, sourceBase(s))
	}
	return sources
}

// CreateSource appends a source to the application.
func (c *applicationServiceImpl) CreateSource(ctx context.Context, app *model.Application, req apisv1.CreateSourceRequest) (*apisv1.SourceBase, error) {
	if sourceIndex(app, req.Name) >= 0 {
		return nil, bcode.ErrApplicationSourceExist
	}
	properties, err := sourceProperties(req.Properties)
	if err != nil {
		return nil, err
	}
	source := v1beta1.ApplicationSource{Name: req.Name, Type: req.Type, Properties: properties, AutoUpdate: req.AutoUpdate}
	app.Sources = append(app.Sources, source)
	if err := c.Store.Put(ctx, app); err != nil {
		return nil, err
	}
	return sourceBase(source), nil
}

// UpdateSource replaces the type, parameter and auto-update of a source, keeping
// the fields VelaUX does not edit.
func (c *applicationServiceImpl) UpdateSource(ctx context.Context, app *model.Application, name string, req apisv1.UpdateSourceRequest) (*apisv1.SourceBase, error) {
	i := sourceIndex(app, name)
	if i < 0 {
		return nil, bcode.ErrApplicationSourceNotExist
	}
	properties, err := sourceProperties(req.Properties)
	if err != nil {
		return nil, err
	}
	app.Sources[i].Type, app.Sources[i].Properties, app.Sources[i].AutoUpdate = req.Type, properties, req.AutoUpdate
	if err := c.Store.Put(ctx, app); err != nil {
		return nil, err
	}
	return sourceBase(app.Sources[i]), nil
}

// DeleteSource removes a source from the application.
func (c *applicationServiceImpl) DeleteSource(ctx context.Context, app *model.Application, name string) error {
	i := sourceIndex(app, name)
	if i < 0 {
		return bcode.ErrApplicationSourceNotExist
	}
	app.Sources = append(app.Sources[:i], app.Sources[i+1:]...)
	return c.Store.Put(ctx, app)
}

func sourceIndex(app *model.Application, name string) int {
	for i, s := range app.Sources {
		if s.Name == name {
			return i
		}
	}
	return -1
}

// sourceProperties checks the request's properties are a JSON object and
// keeps them as JSON, the encoding the Application CR carries.
func sourceProperties(properties string) (*runtime.RawExtension, error) {
	if properties == "" {
		return nil, nil
	}
	var object map[string]any
	if err := json.Unmarshal([]byte(properties), &object); err != nil {
		return nil, bcode.ErrInvalidProperties
	}
	return &runtime.RawExtension{Raw: []byte(properties)}, nil
}

func sourceBase(s v1beta1.ApplicationSource) *apisv1.SourceBase {
	base := &apisv1.SourceBase{Name: s.Name, Type: s.Type, AutoUpdate: s.AutoUpdate}
	properties, err := model.NewJSONStruct(s.Properties)
	if err != nil {
		klog.Warningf("ignoring the properties of source %s: %s", s.Name, err.Error())
	}
	base.Properties = properties
	return base
}
