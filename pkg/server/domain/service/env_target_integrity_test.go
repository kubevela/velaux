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

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/pkg/oam"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/repository"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// groupBoundIn reports whether a RoleBinding in the namespace names the project's group.
func groupBoundIn(ctx context.Context, namespace, project string) bool {
	var bindings rbacv1.RoleBindingList
	Expect(k8sClient.List(ctx, &bindings, client.InNamespace(namespace))).Should(Succeed())
	for _, b := range bindings.Items {
		for _, s := range b.Subjects {
			if s.Kind == rbacv1.GroupKind && s.Name == utils.KubeVelaProjectGroupPrefix+project {
				return true
			}
		}
	}
	return false
}

func createTarget(ctx context.Context, name, project, namespace string) {
	_, err := targetService.CreateTarget(ctx, apisv1.CreateTargetRequest{
		Name:    name,
		Project: project,
		Cluster: &apisv1.ClusterTarget{ClusterName: "local", Namespace: namespace},
	})
	Expect(err).Should(Succeed())
}

var _ = Describe("Env and target integrity", func() {
	BeforeEach(func() {
		InitTestEnv("env-target-integrity")
		for _, p := range []string{"eti-a", "eti-b"} {
			if _, err := projectService.CreateProject(ctx, apisv1.CreateProjectRequest{Name: p}); err != nil {
				Expect(err).Should(MatchError(bcode.ErrProjectIsExist))
			}
		}
	})

	It("refuses an env holding another project's target, on create and on update", func() {
		createTarget(ctx, "eti-b-target", "eti-b", "eti-b-ns")
		createTarget(ctx, "eti-a-target", "eti-a", "eti-a-ns")

		_, err := envService.CreateEnv(ctx, apisv1.CreateEnvRequest{Name: "eti-env-1", Project: "eti-a", Targets: []string{"eti-b-target"}})
		Expect(err).Should(MatchError(bcode.ErrEnvTargetNotInProject))

		_, err = envService.CreateEnv(ctx, apisv1.CreateEnvRequest{Name: "eti-env-1", Project: "eti-a", Targets: []string{"eti-a-target"}})
		Expect(err).Should(Succeed())
		_, err = envService.UpdateEnv(ctx, "eti-env-1", apisv1.UpdateEnvRequest{Targets: []string{"eti-a-target", "eti-b-target"}})
		Expect(err).Should(MatchError(bcode.ErrEnvTargetNotInProject))
	})

	It("fails to generate an env's workflow when one of its targets can't be found", func() {
		createTarget(ctx, "eti-a-target-2", "eti-a", "eti-a-ns-2")
		env := &model.Env{Name: "eti-env-2", Project: "eti-a", Namespace: "eti-env-2", Targets: []string{"eti-a-target-2", "eti-gone"}}
		_, _, err := repository.GenEnvWorkflowStepsAndPolicies(ctx, k8sClient, ds, env, &model.Application{Name: "eti-app", Project: "eti-a"})
		Expect(err).Should(MatchError(ContainSubstring("eti-gone")))
	})

	It("refuses to delete a target an env still lists", func() {
		createTarget(ctx, "eti-a-target-3", "eti-a", "eti-a-ns-3")
		_, err := envService.CreateEnv(ctx, apisv1.CreateEnvRequest{Name: "eti-env-3", Project: "eti-a", Targets: []string{"eti-a-target-3"}})
		Expect(err).Should(Succeed())

		Expect(targetService.DeleteTarget(ctx, "eti-a-target-3")).Should(MatchError(bcode.ErrTargetInUseByEnv))

		_, err = envService.UpdateEnv(ctx, "eti-env-3", apisv1.UpdateEnvRequest{Targets: []string{}})
		Expect(err).Should(Succeed())
		Expect(envService.DeleteEnv(ctx, "eti-env-3")).Should(Succeed())
		Expect(targetService.DeleteTarget(ctx, "eti-a-target-3")).Should(Succeed())
	})

	It("keeps the namespace's labels and the other targets' access when one of several targets on it is deleted", func() {
		const ns = "eti-shared"
		createTarget(ctx, "eti-shared-a1", "eti-a", ns)
		createTarget(ctx, "eti-shared-a2", "eti-a", ns)
		createTarget(ctx, "eti-shared-b", "eti-b", ns)
		Expect(groupBoundIn(ctx, ns, "eti-a")).Should(BeTrue())
		Expect(groupBoundIn(ctx, ns, "eti-b")).Should(BeTrue())

		By("deleting one of project a's two targets")
		Expect(targetService.DeleteTarget(ctx, "eti-shared-a1")).Should(Succeed())
		Expect(groupBoundIn(ctx, ns, "eti-a")).Should(BeTrue())
		Expect(groupBoundIn(ctx, ns, "eti-b")).Should(BeTrue())
		var namespace corev1.Namespace
		Expect(k8sClient.Get(ctx, types.NamespacedName{Name: ns}, &namespace)).Should(Succeed())
		Expect(namespace.Labels[oam.LabelNamespaceOfTargetName]).Should(BeElementOf("eti-shared-a2", "eti-shared-b"))

		By("deleting project a's last target there")
		Expect(targetService.DeleteTarget(ctx, "eti-shared-a2")).Should(Succeed())
		Expect(groupBoundIn(ctx, ns, "eti-a")).Should(BeFalse())
		Expect(groupBoundIn(ctx, ns, "eti-b")).Should(BeTrue())
		Expect(k8sClient.Get(ctx, types.NamespacedName{Name: ns}, &namespace)).Should(Succeed())
		Expect(namespace.Labels[oam.LabelNamespaceOfTargetName]).Should(Equal("eti-shared-b"))

		By("deleting the last target on the namespace")
		Expect(targetService.DeleteTarget(ctx, "eti-shared-b")).Should(Succeed())
		Expect(groupBoundIn(ctx, ns, "eti-b")).Should(BeFalse())
		Expect(k8sClient.Get(ctx, types.NamespacedName{Name: ns}, &namespace)).Should(Succeed())
		Expect(namespace.Labels[oam.LabelNamespaceOfTargetName]).Should(BeEmpty())
	})
	It("finds envs holding a missing target or another project's", func() {
		envs := []datastore.Entity{
			&model.Env{Name: "ok", Project: "a", Targets: []string{"a1"}},
			&model.Env{Name: "bad", Project: "a", Targets: []string{"a1", "b1", "gone"}},
		}
		targets := []datastore.Entity{&model.Target{Name: "a1", Project: "a"}, &model.Target{Name: "b1", Project: "b"}}
		Expect(envTargetProblems(envs, targets)).Should(Equal(map[string][]string{"bad": {"b1", "gone"}}))
	})
})
