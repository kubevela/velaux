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
	"regexp"
	"strings"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/types"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// CustomisationConfigMapName is the ConfigMap in vela-system holding how this
// VelaUX is branded: its logo and the words it uses for its concepts.
const CustomisationConfigMapName = "velaux-configuration"

const (
	customisationLogoKey        = "logoURL"
	customisationIconKey        = "iconURL"
	customisationTitleKey       = "pageTitle"
	customisationSidebarKey     = "sidebarColor"
	customisationAccentKey      = "accentColor"
	customisationTerminologyKey = "terminology"
)

// termName is a word the UI may rename: one capitalised word, as it is written
// in the UI's own text.
var termName = regexp.MustCompile(`^[A-Z][a-zA-Z]*$`)

// maxPageTitle bounds the browser tab's title.
const maxPageTitle = 100

// hexColor is a colour as the sidebar takes it: #rgb or #rrggbb.
var hexColor = regexp.MustCompile(`^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$`)

// CustomisationService reads and writes the branding of this VelaUX.
type CustomisationService interface {
	Get(ctx context.Context) (*apisv1.Customisation, error)
	Update(ctx context.Context, c apisv1.Customisation) (*apisv1.Customisation, error)
}

type customisationServiceImpl struct {
	KubeClient client.Client `inject:"kubeClient"`
}

// NewCustomisationService is the branding kept in the velaux-configuration ConfigMap.
func NewCustomisationService() CustomisationService {
	return &customisationServiceImpl{}
}

// Get reads the customisation; without the ConfigMap, nothing is customised.
func (s *customisationServiceImpl) Get(ctx context.Context) (*apisv1.Customisation, error) {
	cm := &corev1.ConfigMap{}
	if err := s.KubeClient.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: CustomisationConfigMapName}, cm); err != nil {
		if apierrors.IsNotFound(err) {
			return &apisv1.Customisation{}, nil
		}
		return nil, err
	}
	c := &apisv1.Customisation{
		PageTitle:    cm.Data[customisationTitleKey],
		LogoURL:      cm.Data[customisationLogoKey],
		IconURL:      cm.Data[customisationIconKey],
		SidebarColor: cm.Data[customisationSidebarKey],
		AccentColor:  cm.Data[customisationAccentKey],
	}
	if raw := cm.Data[customisationTerminologyKey]; raw != "" {
		if err := json.Unmarshal([]byte(raw), &c.Terminology); err != nil {
			return nil, err
		}
	}
	return c, nil
}

// Update replaces the customisation.
func (s *customisationServiceImpl) Update(ctx context.Context, c apisv1.Customisation) (*apisv1.Customisation, error) {
	if err := validateCustomisation(c); err != nil {
		return nil, err
	}
	data := map[string]string{}
	for key, value := range map[string]string{
		customisationTitleKey:   c.PageTitle,
		customisationLogoKey:    c.LogoURL,
		customisationIconKey:    c.IconURL,
		customisationSidebarKey: c.SidebarColor,
		customisationAccentKey:  c.AccentColor,
	} {
		if value != "" {
			data[key] = value
		}
	}
	if len(c.Terminology) > 0 {
		raw, err := json.Marshal(c.Terminology)
		if err != nil {
			return nil, err
		}
		data[customisationTerminologyKey] = string(raw)
	}
	cm := &corev1.ConfigMap{}
	err := s.KubeClient.Get(ctx, client.ObjectKey{Namespace: types.DefaultKubeVelaNS, Name: CustomisationConfigMapName}, cm)
	switch {
	case apierrors.IsNotFound(err):
		cm = &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: CustomisationConfigMapName, Namespace: types.DefaultKubeVelaNS},
			Data:       data,
		}
		err = s.KubeClient.Create(ctx, cm)
	case err == nil:
		cm.Data = data
		err = s.KubeClient.Update(ctx, cm)
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func validateCustomisation(c apisv1.Customisation) error {
	for _, url := range []string{c.LogoURL, c.IconURL} {
		if url != "" && !strings.HasPrefix(url, "https://") && !strings.HasPrefix(url, "http://") &&
			!strings.HasPrefix(url, "data:image/") && !strings.HasPrefix(url, "/") {
			return bcode.ErrInvalidCustomisation
		}
	}
	if len(c.PageTitle) > maxPageTitle || strings.ContainsAny(c.PageTitle, "\r\n\t") {
		return bcode.ErrInvalidCustomisation
	}
	for _, color := range []string{c.SidebarColor, c.AccentColor} {
		if color != "" && !hexColor.MatchString(color) {
			return bcode.ErrInvalidCustomisation
		}
	}
	for name, term := range c.Terminology {
		if !termName.MatchString(name) || strings.TrimSpace(term.Singular) == "" || strings.TrimSpace(term.Plural) == "" {
			return bcode.ErrInvalidCustomisation
		}
	}
	return nil
}
