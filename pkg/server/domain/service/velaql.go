/*
 Copyright 2021. The KubeVela Authors.

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
	"encoding/base64"
	"errors"
	"strings"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/endpoints/request"

	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	velatypes "github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/auth"
	"github.com/oam-dev/kubevela/pkg/velaql"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/query"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"

	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// VelaQLService velaQL service
type VelaQLService interface {
	QueryView(ctx context.Context, velaQL, project string) (*apis.VelaQLViewResponse, error)
}

type velaQLServiceImpl struct {
	Store datastore.DataStore `inject:"datastore"`
	// ServerKubeClient is VelaUX's own client. A request whose context carries a
	// user goes as that user, so a project's queries read as the project.
	ServerKubeClient client.Client `inject:"serverKubeClient"`
	KubeConfig       *rest.Config  `inject:"kubeConfig"`
}

// NewVelaQLService new velaQL service
func NewVelaQLService() VelaQLService {
	return &velaQLServiceImpl{}
}

// QueryView runs a view. With a project, it reads as the signed-in user in that
// project, through query.Guard, and a view in the project's namespace wins over
// a global one of its name. Without one, which only admins may ask for, it
// reads as VelaUX. Either way the view only reads.
func (v *velaQLServiceImpl) QueryView(ctx context.Context, velaQL, project string) (*apis.VelaQLViewResponse, error) {
	q, err := velaql.ParseVelaQL(velaQL)
	if err != nil {
		return nil, bcode.ErrParseVelaQL
	}
	name, _ := utils.UsernameFrom(ctx)
	klog.Infof("velaql: user %q, project %q, view %s, parameters %v", name, project, q.View, q.Parameter)

	cli := v.ServerKubeClient
	viewNamespace := ""
	ctx = request.WithUser(ctx, nil)
	if project != "" {
		namespaces, err := v.projectNamespaces(ctx, project)
		if err != nil {
			return nil, err
		}
		if name == "" {
			name = user.Anonymous
		}
		ctx = request.WithUser(ctx, &user.DefaultInfo{Name: name, Groups: []string{utils.KubeVelaProjectGroupPrefix + project, auth.KubeVelaClientGroup}})
		cli = query.Guard(v.ServerKubeClient, namespaces)
		viewNamespace = namespaces[0]
	}
	view, err := v.loadView(ctx, viewNamespace, q.View)
	if err != nil {
		return nil, err
	}
	queryValue, err := query.Run(ctx, view, query.Query{Parameter: q.Parameter, Export: q.Export}, cli, v.KubeConfig)
	if err != nil {
		klog.Errorf("fail to query the view %s: %s", q.View, err.Error())
		if forbidden(err) {
			return nil, bcode.ErrViewForbidden
		}
		return nil, bcode.ErrViewQuery
	}

	resp := apis.VelaQLViewResponse{}
	err = queryValue.Decode(&resp)
	if err != nil {
		klog.Errorf("decode the velaQL response to json failure %s", err.Error())
		return nil, bcode.ErrParseQuery2Json
	}
	if strings.Contains(velaQL, "collect-logs") {
		logs, ok := resp["logs"].(string)
		if ok {
			enc, _ := base64.StdEncoding.DecodeString(logs)
			resp["logs"] = string(enc)
		} else {
			resp["logs"] = ""
		}
	}
	return &resp, err
}

// projectNamespaces are the namespaces a project's Applications run in on the
// hub: its own first, then its environments'.
func (v *velaQLServiceImpl) projectNamespaces(ctx context.Context, project string) ([]string, error) {
	p := &model.Project{Name: project}
	if err := v.Store.Get(ctx, p); err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, bcode.ErrProjectIsNotExist
		}
		return nil, err
	}
	namespaces := []string{p.GetNamespace()}
	envs, err := v.Store.List(ctx, &model.Env{Project: project}, nil)
	if err != nil {
		return nil, err
	}
	for _, entity := range envs {
		if ns := entity.(*model.Env).Namespace; ns != "" && ns != namespaces[0] {
			namespaces = append(namespaces, ns)
		}
	}
	return namespaces, nil
}

// loadView is the CUE of the view named name: the project's, from namespace,
// read as the request's user, else the global one, read as VelaUX. Views are
// ConfigMaps holding the CUE under data.template, as KubeVela keeps them.
func (v *velaQLServiceImpl) loadView(ctx context.Context, namespace, name string) (string, error) {
	cm := &corev1.ConfigMap{}
	if namespace != "" {
		err := v.ServerKubeClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: name}, cm)
		if err == nil && cm.Data["template"] != "" {
			return cm.Data["template"], nil
		}
		if err != nil && !apierrors.IsNotFound(err) && !apierrors.IsForbidden(err) {
			return "", err
		}
	}
	err := v.ServerKubeClient.Get(request.WithUser(ctx, nil), client.ObjectKey{Namespace: velatypes.DefaultKubeVelaNS, Name: name}, cm)
	if apierrors.IsNotFound(err) || (err == nil && cm.Data["template"] == "") {
		return "", bcode.ErrViewNotFound
	}
	if err != nil {
		return "", err
	}
	return cm.Data["template"], nil
}

// forbidden is whether err, however a provider wrapped it, is Kubernetes
// refusing a read.
func forbidden(err error) bool {
	var status *apierrors.StatusError
	if errors.As(err, &status) {
		return apierrors.IsForbidden(status)
	}
	return strings.Contains(err.Error(), "is forbidden") || strings.Contains(err.Error(), "only the ResourceTrackers of the project")
}
