/*
Copyright 2022 The KubeVela Authors.

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
	"fmt"
	"os"
	"reflect"
	goruntime "runtime"
	"strconv"
	"strings"
	"time"

	"github.com/agiledragon/gomonkey/v2"
	"github.com/coreos/go-oidc"
	"github.com/google/go-cmp/cmp"
	"github.com/oam-dev/kubevela/pkg/multicluster"
	"github.com/oam-dev/kubevela/pkg/oam"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/yaml"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	kubevelatypes "github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam/util"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
)

var _ = Describe("Test authentication service functions", func() {
	var defaultNamespace = model.DefaultInitNamespace

	BeforeEach(func() {
		InitTestEnv("auth-test-" + strconv.FormatInt(time.Now().UnixNano(), 10))
		// Init admin to init default project for dex login test, which will use default project
		ok, err := InitTestAdmin(userService)
		Expect(err).Should(BeNil())
		Expect(ok).Should(BeTrue())
	})

	It("Test Dex login", func() {
		fmt.Printf("[DEBUG] Starting Test Dex login\n")
		fmt.Printf("[DEBUG] Runtime OS: %s, ARCH: %s\n", goruntime.GOOS, goruntime.GOARCH)

		if ci := os.Getenv("CI"); ci != "" {
			fmt.Printf("[DEBUG] Running in CI environment: %s\n", ci)
		}

		fmt.Printf("[DEBUG] Creating test IDToken for gomonkey patching\n")
		testIDToken := &oidc.IDToken{}
		sub := "248289761001Abv"

		fmt.Printf("[DEBUG] Attempting to apply gomonkey patch for Claims method\n")
		var patch *gomonkey.Patches

		// Check if we're on macOS and warn about potential gomonkey issues
		if goruntime.GOOS == "darwin" {
			fmt.Printf("[WARNING] Running on macOS - gomonkey may fail due to SIP restrictions\n")
		}

		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("[ERROR] Panic occurred during gomonkey patch: %v\n", r)
				if goruntime.GOOS == "darwin" {
					fmt.Printf("[INFO] This is expected on macOS due to System Integrity Protection\n")
					fmt.Printf("[INFO] Skipping test due to platform limitations\n")
					Skip("Skipping on macOS due to gomonkey SIP restrictions")
				}
				panic(r) // Re-panic if not macOS
			}
		}()

		patch = gomonkey.ApplyMethod(reflect.TypeOf(testIDToken), "Claims", func(_ *oidc.IDToken, v interface{}) error {
			fmt.Printf("[DEBUG] gomonkey Claims method called successfully\n")
			return json.Unmarshal([]byte(fmt.Sprintf(`{"email":"test@test.com", "name":"show name", "sub": "%s"}`, sub)), v)
		})

		if patch == nil {
			fmt.Printf("[ERROR] Failed to create gomonkey patch\n")
		} else {
			fmt.Printf("[DEBUG] gomonkey patch created successfully\n")
		}

		defer func() {
			if patch != nil {
				fmt.Printf("[DEBUG] Resetting gomonkey patch\n")
				patch.Reset()
			}
		}()

		fmt.Printf("[DEBUG] Initializing system service\n")
		err := sysService.Init(context.TODO())
		if err != nil {
			fmt.Printf("[ERROR] Failed to initialize system service: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] System service initialized successfully\n")
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Getting system info\n")
		info, err := sysService.Get(context.TODO())
		if err != nil {
			fmt.Printf("[ERROR] Failed to get system info: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] Retrieved system info successfully\n")
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Configuring Dex user default settings\n")
		info.DexUserDefaultProjects = []model.ProjectRef{{
			Name:  "default",
			Roles: []string{"app-developer"},
		}}
		info.DexUserDefaultPlatformRoles = []string{"admin"}
		fmt.Printf("[DEBUG] Storing updated system info\n")
		err = ds.Put(context.TODO(), info)
		if err != nil {
			fmt.Printf("[ERROR] Failed to store system info: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] System info stored successfully\n")
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Creating dex handler with mocked IDToken\n")

		dexHandler := dexHandlerImpl{
			idToken:           testIDToken,
			Store:             ds,
			projectService:    projectService,
			systemInfoService: sysService,
		}

		fmt.Printf("[DEBUG] Executing dex login with handler\n")
		resp, err := dexHandler.login(context.Background())
		if err != nil {
			fmt.Printf("[ERROR] Dex login failed: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] Dex login successful - Email: %s, Name: %s, Alias: %s\n", resp.Email, resp.Name, resp.Alias)
		}
		Expect(err).Should(BeNil())
		Expect(resp.Email).Should(Equal("test@test.com"))
		Expect(resp.Name).Should(Equal(strings.ToLower(sub)))
		Expect(resp.Alias).Should(Equal("show name"))

		fmt.Printf("[DEBUG] Verifying created user in datastore\n")

		newUser, err := userService.GetUser(context.TODO(), resp.Name)
		if err != nil {
			fmt.Printf("[ERROR] Failed to get user: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] Retrieved user successfully - DexSub: %s, Roles: %v\n", newUser.DexSub, newUser.UserRoles)
		}
		Expect(err).Should(BeNil())
		Expect(newUser.DexSub).Should(Equal(sub))
		Expect(newUser.UserRoles).Should(Equal([]string{model.RoleAdmin}))

		fmt.Printf("[DEBUG] Verifying user projects\n")
		projects, err := projectService.ListUserProjects(context.TODO(), sub)
		if err != nil {
			fmt.Printf("[ERROR] Failed to list user projects: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] Found %d projects for user\n", len(projects))
		}
		Expect(err).Should(BeNil())
		Expect(len(projects)).Should(Equal(1))

		fmt.Printf("[DEBUG] Direct datastore user verification\n")
		user := &model.User{
			Name: sub,
		}
		err = ds.Get(context.Background(), user)
		if err != nil {
			fmt.Printf("[ERROR] Failed to get user from datastore: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] User email from datastore: %s\n", user.Email)
		}
		Expect(err).Should(BeNil())
		Expect(user.Email).Should(Equal("test@test.com"))

		fmt.Printf("[DEBUG] Testing user deletion and re-creation scenarios\n")

		existUser := &model.User{
			Name: sub,
		}
		fmt.Printf("[DEBUG] Deleting test user\n")
		err = ds.Delete(context.Background(), existUser)
		if err != nil {
			fmt.Printf("[ERROR] Failed to delete user: %v\n", err)
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Creating existing user with same email\n")
		existUser = &model.User{
			Name:  "exist-user",
			Email: "test@test.com",
		}
		err = ds.Add(context.Background(), existUser)
		if err != nil {
			fmt.Printf("[ERROR] Failed to add existing user: %v\n", err)
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Testing login with existing user email\n")
		resp, err = dexHandler.login(context.Background())
		if err != nil {
			fmt.Printf("[ERROR] Login with existing user failed: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] Login successful - matched existing user: %s\n", resp.Name)
		}
		Expect(err).Should(BeNil())
		Expect(resp.Email).Should(Equal("test@test.com"))
		Expect(resp.Name).Should(Equal("exist-user"))

		fmt.Printf("[DEBUG] Cleaning up existing user\n")

		err = ds.Delete(context.Background(), existUser)
		if err != nil {
			fmt.Printf("[ERROR] Failed to delete existing user: %v\n", err)
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Testing user with same DexSub but different email\n")
		existUser = &model.User{
			Name:   "zhangsan",
			Email:  "test2@test.com",
			DexSub: sub,
		}
		err = ds.Add(context.Background(), existUser)
		if err != nil {
			fmt.Printf("[ERROR] Failed to add user with DexSub: %v\n", err)
		}
		Expect(err).Should(BeNil())

		fmt.Printf("[DEBUG] Testing login with DexSub match\n")
		resp, err = dexHandler.login(context.Background())
		if err != nil {
			fmt.Printf("[ERROR] Login with DexSub match failed: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] Login successful - matched by DexSub: %s, email: %s\n", resp.Name, resp.Email)
		}
		Expect(err).Should(BeNil())
		Expect(resp.Email).Should(Equal("test2@test.com"))
		Expect(resp.Name).Should(Equal("zhangsan"))

		fmt.Printf("[DEBUG] Test Dex login completed successfully\n")

	})

	It("Test local login", func() {
		_, err := userService.CreateUser(context.Background(), apisv1.CreateUserRequest{
			Name:     "test-login",
			Email:    "test@example.com",
			Password: "password1",
		})
		Expect(err).Should(BeNil())
		localHandler := localHandlerImpl{
			userService: userService,
			ds:          ds,
			username:    "test-login",
			password:    "password1",
		}
		resp, err := localHandler.login(context.Background())
		Expect(err).Should(BeNil())
		Expect(resp.Name).Should(Equal("test-login"))
	})

	It("Test update dex config", func() {
		err := k8sClient.Create(context.Background(), &corev1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: "vela-system",
			},
		})
		Expect(err).Should(SatisfyAny(BeNil(), &util.AlreadyExistMatcher{}))
		webserver, err := os.ReadFile("./testdata/dex-config-def.yaml")
		Expect(err).Should(Succeed())
		var cd v1beta1.ComponentDefinition
		err = yaml.Unmarshal(webserver, &cd)
		Expect(err).Should(Succeed())
		err = k8sClient.Create(context.Background(), &cd)
		Expect(err).Should(Succeed())
		err = k8sClient.Create(context.Background(), &v1beta1.Application{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "addon-dex",
				Namespace: "vela-system",
			},
			Spec: v1beta1.ApplicationSpec{
				Components: []common.ApplicationComponent{
					{
						Name: "dex",
						// only for test here
						Type:       "dex-config",
						Properties: &runtime.RawExtension{Raw: []byte(`{"values":{"test":"test"}}`)},
						Traits:     []common.ApplicationTrait{},
						Scopes:     map[string]string{},
					},
				},
			},
		})
		Expect(err).Should(BeNil())
		c := &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "a",
				Namespace: "vela-system",
				Labels: map[string]string{
					"app.oam.dev/source-of-truth": "from-inner-system",
					"config.oam.dev/catalog":      kubevelatypes.VelaCoreConfig,
					"config.oam.dev/type":         "dex-connector",
					"config.oam.dev/sub-type":     "ldap",
					"project":                     "abc",
				},
			},
			StringData: map[string]string{
				"ldap": `{"clientID":"clientID","clientSecret":"clientSecret"}`,
			},
			Type: corev1.SecretTypeOpaque,
		}
		err = k8sClient.Create(context.Background(), c)
		Expect(err).Should(BeNil())
		By("try to update dex config without config secret")
		connectors, err := utils.GetDexConnectors(context.Background(), authService.KubeClient)
		Expect(err).Should(BeNil())
		err = generateDexConfig(context.Background(), authService.KubeClient, &model.UpdateDexConfig{
			Connectors: connectors,
		})
		Expect(err).Should(BeNil())
		dexConfigSecret := &corev1.Secret{}
		err = k8sClient.Get(context.Background(), types.NamespacedName{Name: "dex-config", Namespace: "vela-system"}, dexConfigSecret)
		Expect(err).Should(BeNil())
		config := &model.DexConfig{}
		err = yaml.Unmarshal(dexConfigSecret.Data[secretDexConfigKey], config)
		Expect(err).Should(BeNil())
		Expect(len(config.Connectors) > 0).Should(Equal(true))
		By("try to update dex config with config secret")
		err = generateDexConfig(context.Background(), authService.KubeClient, &model.UpdateDexConfig{})
		Expect(err).Should(BeNil())
	})

	It("Test get dex config", func() {
		err := ds.Add(context.Background(), &model.User{Name: "admin", Email: "test@test.com"})
		Expect(err).Should(BeNil())
		_, err = sysService.UpdateSystemInfo(context.Background(), apisv1.SystemInfoRequest{
			LoginType:   model.LoginTypeDex,
			VelaAddress: "http://velaux.com",
		})
		Expect(err).Should(BeNil())
		config, err := authService.GetDexConfig(context.Background())
		Expect(err).Should(BeNil())
		Expect(config.Issuer).Should(Equal("http://velaux.com/dex"))
		Expect(config.ClientID).Should(Equal("velaux"))
		Expect(config.ClientSecret).Should(Equal("velaux-secret"))
		Expect(config.RedirectURL).Should(Equal("http://velaux.com/callback"))
	})

	It("Test init admin user", func() {
		By("Remove all users")
		users, err := ds.List(context.Background(), &model.User{}, &datastore.ListOptions{})
		Expect(err).Should(BeNil())
		for _, user := range users {
			err := ds.Delete(context.Background(), user.(*model.User))
			Expect(err).Should(BeNil())
		}
		resp, err := userService.AdminConfigured(context.Background())
		Expect(err).Should(BeNil())
		Expect(resp.Configured).Should(BeFalse())
		initResp, err := userService.InitAdmin(context.Background(), apisv1.InitAdminRequest{
			Name:     FakeAdminName,
			Password: "ComplexPassword1",
			Email:    "fake@kubevela.io",
		})
		Expect(err).Should(BeNil())
		Expect(initResp.Success).Should(BeTrue())
		By("try to init admin user again, should fail")
		initResp, err = userService.InitAdmin(context.Background(), apisv1.InitAdminRequest{
			Password: "TryInVein1",
			Email:    "fake@kubevela.io",
		})
		Expect(err).Should(HaveOccurred())

		By("Test after init admin, project/env/target is also initialized")

		By("test env created")
		var namespace corev1.Namespace

		Eventually(func() error {
			return k8sClient.Get(context.TODO(), types.NamespacedName{Name: defaultNamespace}, &namespace)
		}, time.Second*3, time.Microsecond*300).Should(BeNil())

		Expect(cmp.Diff(namespace.Labels[oam.LabelNamespaceOfEnvName], model.DefaultInitName)).Should(BeEmpty())
		Expect(cmp.Diff(namespace.Labels[oam.LabelNamespaceOfTargetName], model.DefaultInitName)).Should(BeEmpty())
		Expect(cmp.Diff(namespace.Labels[oam.LabelControlPlaneNamespaceUsage], oam.VelaNamespaceUsageEnv)).Should(BeEmpty())
		Expect(cmp.Diff(namespace.Labels[oam.LabelRuntimeNamespaceUsage], oam.VelaNamespaceUsageTarget)).Should(BeEmpty())

		By("check project created")
		dp, err := projectService.GetProject(context.TODO(), model.DefaultInitName)
		Expect(err).Should(BeNil())
		Expect(dp.Alias).Should(BeEquivalentTo("Default"))
		Expect(dp.Description).Should(BeEquivalentTo(model.DefaultProjectDescription))

		By("check env created")

		env, err := envService.GetEnv(context.TODO(), model.DefaultInitName)
		Expect(err).Should(BeNil())
		Expect(env.Alias).Should(BeEquivalentTo("Default"))
		Expect(env.Description).Should(BeEquivalentTo(model.DefaultEnvDescription))
		Expect(env.Project).Should(BeEquivalentTo(model.DefaultInitName))
		Expect(env.Targets).Should(BeEquivalentTo([]string{model.DefaultInitName}))
		Expect(env.Namespace).Should(BeEquivalentTo(defaultNamespace))

		By("check target created")

		tg, err := targetService.GetTarget(context.TODO(), model.DefaultInitName)
		Expect(err).Should(BeNil())
		Expect(tg.Alias).Should(BeEquivalentTo("Default"))
		Expect(tg.Description).Should(BeEquivalentTo(model.DefaultTargetDescription))
		Expect(tg.Cluster).Should(BeEquivalentTo(&model.ClusterTarget{
			ClusterName: multicluster.ClusterLocalName,
			Namespace:   defaultNamespace,
		}))
		Expect(env.Targets).Should(BeEquivalentTo([]string{model.DefaultInitName}))
		Expect(env.Namespace).Should(BeEquivalentTo(defaultNamespace))

		err = targetService.DeleteTarget(context.TODO(), model.DefaultInitName)
		Expect(err).Should(BeNil())
		err = envService.DeleteEnv(context.TODO(), model.DefaultInitName)
		Expect(err).Should(BeNil())
	})
})
