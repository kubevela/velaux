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
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Project access", func() {
	BeforeEach(func() {
		InitTestEnv("project-access")
	})

	It("revokes the project's access to its namespace when the project is deleted", func() {
		_, err := projectService.CreateProject(ctx, apisv1.CreateProjectRequest{Name: "pa-gone", Namespace: "pa-gone-ns"})
		Expect(err).Should(Succeed())
		Expect(groupBoundIn(ctx, "pa-gone-ns", "pa-gone")).Should(BeTrue())

		Expect(projectService.DeleteProject(ctx, "pa-gone")).Should(Succeed())
		Expect(groupBoundIn(ctx, "pa-gone-ns", "pa-gone")).Should(BeFalse())
	})

	It("lists and removes access left behind for projects that no longer exist", func() {
		_, err := projectService.CreateProject(ctx, apisv1.CreateProjectRequest{Name: "pa-live", Namespace: "pa-left-ns"})
		Expect(err).Should(Succeed())
		By("a binding that also names a project deleted before revokes worked")
		var binding rbacv1.RoleBinding
		Expect(k8sClient.Get(ctx, types.NamespacedName{Namespace: "pa-left-ns", Name: "kubevela:writer:application:binding"}, &binding)).Should(Succeed())
		binding.Subjects = append(binding.Subjects, rbacv1.Subject{Kind: rbacv1.GroupKind, APIGroup: rbacv1.GroupName, Name: utils.KubeVelaProjectGroupPrefix + "pa-ghost"})
		Expect(k8sClient.Update(ctx, &binding)).Should(Succeed())
		By("and a binding that names only a deleted project")
		Expect(k8sClient.Create(ctx, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "pa-ghost-ns"}})).Should(Succeed())
		Expect(k8sClient.Create(ctx, &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{Namespace: "pa-ghost-ns", Name: "kubevela:writer:application:binding"},
			RoleRef:    rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "ClusterRole", Name: "kubevela:writer:application"},
			Subjects: []rbacv1.Subject{
				{Kind: rbacv1.GroupKind, APIGroup: rbacv1.GroupName, Name: utils.KubeVelaProjectGroupPrefix + "pa-ghost"},
				// A group that is the bare prefix names no project, so it is passed over.
				{Kind: rbacv1.GroupKind, APIGroup: rbacv1.GroupName, Name: utils.KubeVelaProjectGroupPrefix},
			},
		})).Should(Succeed())

		ps := projectService
		// Other specs share the cluster but not this datastore, so their projects look stale here too.
		mine := func(all []apisv1.StaleProjectAccess) []apisv1.StaleProjectAccess {
			var out []apisv1.StaleProjectAccess
			for _, a := range all {
				if a.Project == "pa-ghost" || a.Project == "pa-live" {
					out = append(out, a)
				}
			}
			return out
		}
		all, err := ps.ListStaleProjectAccess(ctx)
		stale := mine(all)
		Expect(err).Should(Succeed())
		Expect(stale).Should(ConsistOf(
			apisv1.StaleProjectAccess{Namespace: "pa-left-ns", Binding: "kubevela:writer:application:binding", Project: "pa-ghost", Role: "kubevela:writer:application"},
			apisv1.StaleProjectAccess{Namespace: "pa-ghost-ns", Binding: "kubevela:writer:application:binding", Project: "pa-ghost", Role: "kubevela:writer:application"},
		))

		By("refusing to remove a live project's access")
		Expect(ps.RemoveStaleProjectAccess(ctx, apisv1.StaleProjectAccess{Namespace: "pa-left-ns", Binding: "kubevela:writer:application:binding", Project: "pa-live"})).
			Should(MatchError(bcode.ErrProjectAccessNotStale))

		By("removing the stale subject and keeping the live one")
		Expect(ps.RemoveStaleProjectAccess(ctx, stale[0])).Should(Succeed())
		Expect(ps.RemoveStaleProjectAccess(ctx, stale[1])).Should(Succeed())
		Expect(groupBoundIn(ctx, "pa-left-ns", "pa-ghost")).Should(BeFalse())
		Expect(groupBoundIn(ctx, "pa-left-ns", "pa-live")).Should(BeTrue())
		Expect(groupBoundIn(ctx, "pa-ghost-ns", "pa-ghost")).Should(BeFalse())
		all, err = ps.ListStaleProjectAccess(ctx)
		Expect(err).Should(Succeed())
		Expect(mine(all)).Should(BeEmpty())
	})
})
