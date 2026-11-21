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
// Package kubevelagates keeps the KubeVela feature gates in VelaUX's process
// as the KubeVela controller has them. VelaUX runs KubeVela code itself (dry-run,
// compare, rendering), and with its own defaults that code disagrees with the
// controller on any gate the controller was started with.
package kubevelagates

import (
	"context"
	"sort"
	"strconv"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/component-base/featuregate"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ConfigMapName is the ConfigMap the KubeVela controller publishes its gates in
// on start, in its system namespace: a key per gate, "true" or "false".
const ConfigMapName = "kubevela-feature-gates"

// Syncer applies the published gates to Gate.
type Syncer struct {
	Reader    client.Reader
	Namespace string
	Gate      featuregate.MutableFeatureGate

	missingLogged bool
	unknownLogged map[string]bool
}

// Sync applies the published gates once. No ConfigMap, as from a controller
// that does not publish them, leaves the gates as they are.
func (s *Syncer) Sync(ctx context.Context) error {
	cm := &corev1.ConfigMap{}
	if err := s.Reader.Get(ctx, types.NamespacedName{Namespace: s.Namespace, Name: ConfigMapName}, cm); err != nil {
		if apierrors.IsNotFound(err) {
			if !s.missingLogged {
				klog.InfoS("The KubeVela controller publishes no feature gates; keeping VelaUX's defaults", "configMap", klog.KRef(s.Namespace, ConfigMapName))
				s.missingLogged = true
			}
			return nil
		}
		return err
	}
	s.missingLogged = false
	for _, name := range apply(s.Gate, cm.Data) {
		if s.unknownLogged == nil {
			s.unknownLogged = map[string]bool{}
		}
		if !s.unknownLogged[name] {
			klog.InfoS("Skipping a KubeVela feature gate VelaUX's KubeVela does not know", "gate", name)
			s.unknownLogged[name] = true
		}
	}
	return nil
}

// Run syncs now, then every interval until ctx ends: the controller publishes
// on start, which may come after VelaUX's, and again when restarted with other
// flags.
func (s *Syncer) Run(ctx context.Context, interval time.Duration) {
	if err := s.Sync(ctx); err != nil {
		klog.ErrorS(err, "Failed to read the KubeVela feature gates")
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.Sync(ctx); err != nil {
				klog.ErrorS(err, "Failed to read the KubeVela feature gates")
			}
		}
	}
}

// apply sets each gate gate knows to its published value, one at a time so a
// bad value costs only its own gate, and is the names it does not know.
func apply(gate featuregate.MutableFeatureGate, published map[string]string) []string {
	known := gate.GetAll()
	var unknown []string
	for name, value := range published {
		if _, ok := known[featuregate.Feature(name)]; !ok {
			unknown = append(unknown, name)
			continue
		}
		on, err := strconv.ParseBool(value)
		if err != nil {
			klog.ErrorS(err, "Skipping a KubeVela feature gate with a value that is not a bool", "gate", name, "value", value)
			continue
		}
		if gate.Enabled(featuregate.Feature(name)) == on {
			continue
		}
		if err := gate.SetFromMap(map[string]bool{name: on}); err != nil {
			klog.ErrorS(err, "Failed to set a KubeVela feature gate", "gate", name)
			continue
		}
		klog.InfoS("KubeVela feature gate set as the controller has it", "gate", name, "enabled", on)
	}
	sort.Strings(unknown)
	return unknown
}
