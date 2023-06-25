/*
Copyright 2023 The KubeVela Authors.

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
	"errors"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/yaml"

	velatypes "github.com/oam-dev/kubevela/apis/types"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	v1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Test target service functions", func() {
	var systemService *systemInfoServiceImpl

	BeforeEach(func() {
		ds, err := NewDatastore(datastore.Config{Type: "kubeapi", Database: "system-test-kubevela"})
		Expect(err).Should(BeNil())
		Expect(ds).ShouldNot(BeNil())
		systemService = &systemInfoServiceImpl{Store: ds, KubeClient: k8sClient}
	})

	It("Test UpdateSystemInfo", func() {
		err := systemService.Store.Add(context.TODO(), &model.User{Name: "test-admin", Email: "test@email", UserRoles: []string{model.RoleAdmin}})
		Expect(err).Should(BeNil())
		s, err := systemService.UpdateSystemInfo(context.TODO(), v1.SystemInfoRequest{LoginType: "dex"})
		if errors.Is(err, bcode.ErrNoDexConnector) {
			var cc corev1.Secret
			Expect(yaml.Unmarshal([]byte(connectorConfig), &cc)).Should(BeNil())
			cc.Namespace = velatypes.DefaultKubeVelaNS
			Expect(k8sClient.Create(context.TODO(), &cc)).Should(BeNil())
			s, err = systemService.UpdateSystemInfo(context.TODO(), v1.SystemInfoRequest{LoginType: "dex"})
			Expect(err).Should(BeNil())
		}
		Expect(s.LoginType).Should(Equal("dex"))
		var secret corev1.Secret
		Expect(k8sClient.Get(context.TODO(), types.NamespacedName{Name: dexConfigName, Namespace: velatypes.DefaultKubeVelaNS}, &secret)).Should(BeNil())
		var dc model.DexConfig
		Expect(yaml.Unmarshal(secret.Data[secretDexConfigKey], &dc)).Should(BeNil())
		Expect(len(dc.StaticPasswords)).Should(Equal(1))
	})
})

var connectorConfig = `apiVersion: v1
data:
  github: eyJjbGllbnRJRCI6ImdpdGh1YiIsImNsaWVudFNlY3JldCI6ImdpdGh1YiIsInJlZGlyZWN0VVJJIjoiaHR0cDovLzEyNy4wLjAuMS9kZXgvY2FsbGJhY2sifQ==
kind: Secret
metadata:
  annotations:
    config.oam.dev/alias: ""
    config.oam.dev/description: ""
    config.oam.dev/sensitive: "false"
    config.oam.dev/template-namespace: vela-system
  labels:
    config.oam.dev/catalog: velacore-config
    config.oam.dev/scope: system
    config.oam.dev/sub-type: github
    config.oam.dev/type: dex-connector
  name: github
  namespace: vela-system
type: Opaque
`
