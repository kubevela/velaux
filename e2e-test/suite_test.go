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

package e2e_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	v1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/velaux/pkg/server"
	"github.com/kubevela/velaux/pkg/server/config"
	"github.com/kubevela/velaux/pkg/server/infrastructure/clients"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var k8sClient client.Client
var token string

const (
	baseDomain    = "http://127.0.0.1:8001"
	baseURL       = "http://127.0.0.1:8001/api/v1"
	testNSprefix  = "api-test-"
	fakeAdminName = "admin"
)

func TestE2eApiserverTest(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "E2eApiserverTest Suite")
}

// Suite test in e2e-apiserver-test relies on the pre-setup kubernetes environment
var _ = BeforeSuite(func() {
	defer GinkgoRecover()

	ctx := context.Background()

	cfg := config.Config{
		BindAddr: "127.0.0.1:8001",
		Datastore: datastore.Config{
			Type:     "kubeapi",
			Database: "kubevela",
		},
		AddonCacheTime: 10 * time.Minute,
		KubeQPS:        100,
		KubeBurst:      300,
		PluginConfig: config.PluginConfig{
			CustomPluginPath: []string{"../e2e-plugins"},
		},
	}
	cfg.LeaderConfig.ID = uuid.New().String()
	cfg.LeaderConfig.LockName = "apiserver-lock"
	cfg.LeaderConfig.Duration = time.Second * 10

	server := server.New(cfg)
	Expect(server).ShouldNot(BeNil())
	go func() {
		defer GinkgoRecover()
		err := server.Run(ctx, make(chan error))
		Expect(err).ShouldNot(HaveOccurred())
	}()
	By("wait for api server to start")
	defaultAdminPassword := "VelaUX12345"
	Eventually(
		func() error {
			password := os.Getenv("VELA_UX_PASSWORD")
			if password == "" {
				password = defaultAdminPassword
			}
			// init admin user
			var initReq = apisv1.InitAdminRequest{
				Name:     fakeAdminName,
				Password: password,
				Email:    "fake@email.com",
			}
			bodyByte, err := json.Marshal(initReq)
			Expect(err).Should(BeNil())
			initHtpReq, err := http.NewRequest("PUT", baseURL+"/auth/init_admin", bytes.NewBuffer(bodyByte))
			Expect(err).Should(BeNil())
			initHtpReq.Header.Set("Content-Type", "application/json")
			res, err := http.DefaultClient.Do(initHtpReq)
			if err != nil {
				return err
			}
			// either 200 or "admin user is already configured"
			if res.StatusCode != 200 {
				body, err := io.ReadAll(res.Body)
				Expect(err).Should(BeNil())
				if !strings.Contains(string(body), "admin user is already configured") {
					return fmt.Errorf("init admin failed: %s", string(body))
				}
			}

			// login
			var req = apisv1.LoginRequest{
				Username: fakeAdminName,
				Password: password,
			}
			bodyByte, err = json.Marshal(req)
			Expect(err).Should(BeNil())

			resp, err := http.Post(baseURL+"/auth/login", "application/json", bytes.NewBuffer(bodyByte))
			if err != nil {
				return err
			}
			if resp.StatusCode == 200 {
				loginResp := &apisv1.LoginResponse{}
				err = json.NewDecoder(resp.Body).Decode(loginResp)
				Expect(err).Should(BeNil())
				token = "Bearer " + loginResp.AccessToken
				var req = apisv1.CreateProjectRequest{
					Name:        appProject,
					Description: "test project",
				}
				_ = post("/projects", req)
				return nil
			}
			code := &bcode.Bcode{}
			err = json.NewDecoder(resp.Body).Decode(code)
			Expect(err).Should(BeNil())
			return fmt.Errorf("rest service not ready code:%d message:%s", resp.StatusCode, code.Message)
		}).WithTimeout(time.Second * 60).WithPolling(time.Millisecond * 200).Should(Succeed())
	var err error
	k8sClient, err = clients.GetKubeClient()
	Expect(err).ShouldNot(HaveOccurred())
	By("api server started")
})

var _ = AfterSuite(func() {
	By("tearing down the test environment")
	var nsList v1.NamespaceList
	if k8sClient != nil {
		err := k8sClient.List(context.TODO(), &nsList)
		Expect(err).ToNot(HaveOccurred())
		for _, ns := range nsList.Items {
			if strings.HasPrefix(ns.Name, testNSprefix) {
				_ = k8sClient.Delete(context.TODO(), &ns)
			}
		}
	}
})

func post(path string, body interface{}) *http.Response {
	b, err := json.Marshal(body)
	Expect(err).Should(BeNil())
	client := &http.Client{}
	if !strings.HasPrefix(path, "/v1") {
		path = baseURL + path
	} else {
		path = baseDomain + path
	}
	req, err := http.NewRequest(http.MethodPost, path, bytes.NewBuffer(b))
	Expect(err).Should(BeNil())
	req.Header.Add("Authorization", token)
	req.Header.Add("Content-Type", "application/json")

	response, err := client.Do(req)
	Expect(err).Should(BeNil())
	return response
}

func put(path string, body interface{}) *http.Response {
	b, err := json.Marshal(body)
	Expect(err).Should(BeNil())
	client := &http.Client{}
	if !strings.HasPrefix(path, "/v1") {
		path = baseURL + path
	} else {
		path = baseDomain + path
	}
	req, err := http.NewRequest(http.MethodPut, path, bytes.NewBuffer(b))
	Expect(err).Should(BeNil())
	req.Header.Add("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	response, err := client.Do(req)
	Expect(err).Should(BeNil())
	return response
}

func get(path string) *http.Response {
	client := &http.Client{}
	if !strings.HasPrefix(path, "http") {
		if !strings.HasPrefix(path, "/v1") {
			path = baseURL + path
		} else {
			path = baseDomain + path
		}
	}
	req, err := http.NewRequest(http.MethodGet, path, nil)
	Expect(err).Should(BeNil())
	req.Header.Add("Authorization", token)

	response, err := client.Do(req)
	Expect(err).Should(BeNil())
	return response
}

func getWithQuery(path string, params map[string]string) *http.Response {
	client := &http.Client{}
	if !strings.HasPrefix(path, "/v1") {
		path = baseURL + path
	} else {
		path = baseDomain + path
	}
	req, err := http.NewRequest(http.MethodGet, path, nil)
	Expect(err).Should(BeNil())
	req.Header.Add("Authorization", token)
	query := req.URL.Query()
	for k, v := range params {
		query.Set(k, v)
	}
	req.URL.RawQuery = query.Encode()
	response, err := client.Do(req)
	Expect(err).Should(BeNil())
	return response
}

func delete(path string) *http.Response {
	client := &http.Client{}
	if !strings.HasPrefix(path, "/v1") {
		path = baseURL + path
	} else {
		path = baseDomain + path
	}
	req, err := http.NewRequest(http.MethodDelete, path, nil)
	Expect(err).Should(BeNil())
	req.Header.Add("Authorization", token)
	response, err := client.Do(req)
	Expect(err).Should(BeNil())
	return response
}

func decodeResponseBody(resp *http.Response, dst interface{}) error {
	if resp.Body == nil {
		return fmt.Errorf("response body is nil")
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if dst != nil {
		err = json.Unmarshal(body, dst)
		if err != nil {
			return err
		}
	}
	if resp.StatusCode != 200 {
		return fmt.Errorf("response code is not 200: %d body: %s", resp.StatusCode, string(body))
	}
	return nil
}
