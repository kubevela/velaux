/*
Copyright 2021 The KubeVela Authors.

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

package collect

import (
	"context"
	"fmt"
	"math/rand"
	"testing"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"k8s.io/client-go/rest"
	"k8s.io/utils/pointer"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"

	"github.com/oam-dev/kubevela/pkg/utils/common"

	"github.com/kubevela/velaux/pkg/server/infrastructure/clients"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/mongodb"
)

var cfg *rest.Config
var k8sClient client.Client
var testEnv *envtest.Environment

func TestCalculateJob(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Caclculate systemInfo cronJob")
}

var _ = BeforeSuite(func(ctx SpecContext) {
	rand.Seed(time.Now().UnixNano())
	By("bootstrapping test environment")

	testEnv = &envtest.Environment{
		ControlPlaneStartTimeout: time.Minute * 3,
		ControlPlaneStopTimeout:  time.Minute,
		UseExistingCluster:       pointer.Bool(false),
		CRDDirectoryPaths:        []string{"../../../../test/crds"},
	}

	By("start kube test env")
	var err error
	cfg, err = testEnv.Start()
	Expect(err).Should(BeNil())
	Expect(cfg).ToNot(BeNil())

	By("new kube client")
	cfg.Timeout = time.Minute * 2
	k8sClient, err = client.New(cfg, client.Options{Scheme: common.Scheme})
	Expect(err).Should(BeNil())
	Expect(k8sClient).ToNot(BeNil())
	By("new kube client success")
	clients.SetKubeClient(k8sClient)
	Expect(err).Should(BeNil())

}, NodeTimeout(time.Minute))

var _ = AfterSuite(func() {
	By("tearing down the test environment")
	err := testEnv.Stop()
	Expect(err).ToNot(HaveOccurred())
})

func NewDatastore(cfg datastore.Config) (ds datastore.DataStore, err error) {
	switch cfg.Type {
	case "mongodb":
		ds, err = mongodb.New(context.Background(), cfg)
		if err != nil {
			return nil, fmt.Errorf("create mongodb datastore instance failure %w", err)
		}
	case "kubeapi":
		ds, err = kubeapi.New(context.Background(), cfg, k8sClient)
		if err != nil {
			return nil, fmt.Errorf("create mongodb datastore instance failure %w", err)
		}
	default:
		return nil, fmt.Errorf("not support datastore type %s", cfg.Type)
	}
	return ds, nil
}
