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
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"sort"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8stypes "k8s.io/apimachinery/pkg/types"
	"k8s.io/klog/v2"

	"github.com/oam-dev/kubevela/apis/types"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/report"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

// builtinHashAnnotation is the hash of the built-in report a ConfigMap was
// installed from; its data hashing otherwise means an admin edited it.
const builtinHashAnnotation = "velaux.oam.dev/builtin-hash"

type builtinAction int

const (
	builtinLeave builtinAction = iota
	builtinCreate
	builtinUpgrade
	// builtinRecordOnly records a built-in whose name an admin's own report
	// already has, so it is never installed over it.
	builtinRecordOnly
)

// Init installs the built-in reports into vela-system.
func (r *reportServiceImpl) Init(ctx context.Context) error {
	return r.installBuiltins(ctx, report.Builtins())
}

// installBuiltins installs each built-in as decideBuiltin says, recording what
// it installed, and retires those it installed that it no longer ships. A
// built-in it cannot install is logged, not fatal: reports are not what VelaUX
// needs to start.
func (r *reportServiceImpl) installBuiltins(ctx context.Context, builtins map[string]string) error {
	names := make([]string, 0, len(builtins))
	for name := range builtins {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		if err := r.installBuiltin(ctx, name, builtins[name]); err != nil {
			klog.Warningf("built-in report %s: %v", name, err)
		}
	}
	records, err := r.Store.List(ctx, &model.BuiltinReport{}, nil)
	if err != nil {
		klog.Warningf("built-in reports: %v", err)
		return nil
	}
	for _, e := range records {
		if record, ok := e.(*model.BuiltinReport); ok {
			if _, shipped := builtins[record.Name]; !shipped {
				if err := r.retireBuiltin(ctx, record); err != nil {
					klog.Warningf("retired built-in report %s: %v", record.Name, err)
				}
			}
		}
	}
	return nil
}

// retireBuiltin removes a built-in VelaUX no longer ships, unless an admin
// edited it, which makes it theirs; either way VelaUX stops tracking it.
func (r *reportServiceImpl) retireBuiltin(ctx context.Context, record *model.BuiltinReport) error {
	cm := &corev1.ConfigMap{}
	err := r.ServerKubeClient.Get(ctx, k8stypes.NamespacedName{Namespace: types.DefaultKubeVelaNS, Name: record.Name}, cm)
	switch {
	case err == nil:
		installedAs := cm.Annotations[builtinHashAnnotation]
		if installedAs == record.Hash && hashOf(cm.Data[reportTemplateKey]) == installedAs {
			if err := r.ServerKubeClient.Delete(ctx, cm); err != nil && !apierrors.IsNotFound(err) {
				return err
			}
		}
	case !apierrors.IsNotFound(err):
		return err
	}
	return r.Store.Delete(ctx, record)
}

func (r *reportServiceImpl) installBuiltin(ctx context.Context, name, src string) error {
	record := &model.BuiltinReport{Name: name}
	if err := r.Store.Get(ctx, record); err != nil {
		if !errors.Is(err, datastore.ErrRecordNotExist) {
			return err
		}
		record = nil
	}
	cm := &corev1.ConfigMap{}
	if err := r.ServerKubeClient.Get(ctx, k8stypes.NamespacedName{Namespace: types.DefaultKubeVelaNS, Name: name}, cm); err != nil {
		if !apierrors.IsNotFound(err) {
			return err
		}
		cm = nil
	}
	hash := hashOf(src)
	switch decideBuiltin(record, cm, src) {
	case builtinLeave:
		return nil
	case builtinCreate:
		cm = &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: types.DefaultKubeVelaNS}}
		setBuiltin(cm, src)
		if err := r.ServerKubeClient.Create(ctx, cm); err != nil {
			return err
		}
	case builtinUpgrade:
		setBuiltin(cm, src)
		if err := r.ServerKubeClient.Update(ctx, cm); err != nil {
			return err
		}
	}
	if record == nil {
		return r.Store.Add(ctx, &model.BuiltinReport{Name: name, Hash: hash})
	}
	record.Hash = hash
	return r.Store.Put(ctx, record)
}

// decideBuiltin is what to do with a built-in report, given the record of
// installing it, if any, and the ConfigMap of its name, if any.
func decideBuiltin(record *model.BuiltinReport, cm *corev1.ConfigMap, src string) builtinAction {
	switch {
	case record == nil && cm == nil:
		return builtinCreate
	case record == nil:
		return builtinRecordOnly
	case cm == nil:
		// Installed before, so an admin deleted it.
		return builtinLeave
	}
	installedAs := cm.Annotations[builtinHashAnnotation]
	if installedAs == "" || hashOf(cm.Data[reportTemplateKey]) != installedAs {
		// Edited since it was installed: the admin's now.
		return builtinLeave
	}
	if installedAs == hashOf(src) {
		return builtinLeave
	}
	return builtinUpgrade
}

func setBuiltin(cm *corev1.ConfigMap, src string) {
	if cm.Labels == nil {
		cm.Labels = map[string]string{}
	}
	cm.Labels[reportLabel] = True
	if cm.Annotations == nil {
		cm.Annotations = map[string]string{}
	}
	cm.Annotations[builtinHashAnnotation] = hashOf(src)
	cm.Data = map[string]string{reportTemplateKey: src}
}

func hashOf(src string) string {
	sum := sha256.Sum256([]byte(src))
	return hex.EncodeToString(sum[:])
}
