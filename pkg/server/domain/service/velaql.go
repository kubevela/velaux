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
	"strings"

	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/workflow/pkg/cue/packages"

	"github.com/oam-dev/kubevela/pkg/velaql"

	"github.com/kubevela/velaux/pkg/server/infrastructure/clients"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// VelaQLService velaQL service
type VelaQLService interface {
	QueryView(context.Context, string) (*apis.VelaQLViewResponse, error)
}

type velaQLServiceImpl struct {
	KubeClient client.Client `inject:"kubeClient"`
	KubeConfig *rest.Config  `inject:"kubeConfig"`
	pd         *packages.PackageDiscover
}

// NewVelaQLService new velaQL service
func NewVelaQLService() VelaQLService {
	pd, err := clients.GetPackageDiscover()
	if err != nil {
		klog.Fatalf("get package discover failure %s", err.Error())
	}
	return &velaQLServiceImpl{
		pd: pd,
	}
}

// QueryView get the view query results
func (v *velaQLServiceImpl) QueryView(ctx context.Context, velaQL string) (*apis.VelaQLViewResponse, error) {
	query, err := velaql.ParseVelaQL(velaQL)
	if err != nil {
		return nil, bcode.ErrParseVelaQL
	}

	queryValue, err := velaql.NewViewHandler(v.KubeClient, v.KubeConfig, v.pd).QueryView(utils.ContextWithUserInfo(ctx), query)
	if err != nil {
		klog.Errorf("fail to query the view %s", err.Error())
		return nil, bcode.ErrViewQuery
	}

	resp := apis.VelaQLViewResponse{}
	err = queryValue.UnmarshalTo(&resp)
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
