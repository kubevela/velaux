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
	"strconv"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

var _ = Describe("Sessions", Ordered, func() {
	const name, password = "session-user", "password1"
	ctx := context.Background()

	BeforeEach(func() {
		InitTestEnv("session-test-" + strconv.FormatInt(time.Now().UnixNano(), 10))
		ok, err := InitTestAdmin(userService)
		Expect(err).Should(BeNil())
		Expect(ok).Should(BeTrue())
		_, err = userService.CreateUser(ctx, apisv1.CreateUserRequest{Name: name, Email: "s@example.com", Password: password, Roles: []string{}})
		Expect(err).Should(BeNil())
	})

	login := func() *apisv1.LoginResponse {
		resp, err := authService.Login(ctx, apisv1.LoginRequest{Username: name, Password: password})
		Expect(err).Should(BeNil())
		return resp
	}
	user := func() *model.User {
		u, err := userService.GetUser(ctx, name)
		Expect(err).Should(BeNil())
		return u
	}
	stillValid := func(resp *apisv1.LoginResponse) {
		_, _, err := authService.ValidateToken(ctx, resp.AccessToken, GrantTypeAccess)
		Expect(err).Should(BeNil())
		_, err = authService.RefreshToken(ctx, resp.RefreshToken)
		Expect(err).Should(BeNil())
	}
	revoked := func(resp *apisv1.LoginResponse) {
		_, _, err := authService.ValidateToken(ctx, resp.AccessToken, GrantTypeAccess)
		Expect(err).ShouldNot(BeNil(), "the access token still works")
		_, err = authService.RefreshToken(ctx, resp.RefreshToken)
		Expect(err).ShouldNot(BeNil(), "the refresh token still works")
	}

	It("refuses a disabled user at login, without recording the login", func() {
		Expect(userService.DisableUser(ctx, user())).Should(Succeed())
		before := user().LastLoginTime
		_, err := authService.Login(ctx, apisv1.LoginRequest{Username: name, Password: password})
		Expect(err).Should(Equal(bcode.ErrUserAlreadyDisabled))
		Expect(user().LastLoginTime).Should(Equal(before))
	})

	It("ends every session when the user is disabled, and enabling does not bring them back", func() {
		resp := login()
		stillValid(resp)
		Expect(userService.DisableUser(ctx, user())).Should(Succeed())
		revoked(resp)
		Expect(userService.EnableUser(ctx, user())).Should(Succeed())
		revoked(resp)
		stillValid(login())
	})

	It("ends every session when the password changes", func() {
		resp := login()
		_, err := userService.UpdateUser(ctx, user(), apisv1.UpdateUserRequest{Password: "password2"})
		Expect(err).Should(BeNil())
		revoked(resp)
	})

	It("ends every session when the roles change", func() {
		resp := login()
		roles := []string{"admin"}
		_, err := userService.UpdateUser(ctx, user(), apisv1.UpdateUserRequest{Roles: &roles})
		Expect(err).Should(BeNil())
		revoked(resp)
	})

	It("keeps sessions when only the alias or email changes", func() {
		resp := login()
		_, err := userService.UpdateUser(ctx, user(), apisv1.UpdateUserRequest{Alias: "someone"})
		Expect(err).Should(BeNil())
		stillValid(resp)
	})

	It("ends every session when the user is deleted", func() {
		resp := login()
		Expect(userService.DeleteUser(ctx, name)).Should(Succeed())
		revoked(resp)
	})

	It("ends every session on logout", func() {
		resp, other := login(), login()
		Expect(authService.Logout(ctx, name)).Should(Succeed())
		revoked(resp)
		revoked(other)
		stillValid(login())
	})

	It("rotates the refresh token", func() {
		resp := login()
		refreshed, err := authService.RefreshToken(ctx, resp.RefreshToken)
		Expect(err).Should(BeNil())
		Expect(refreshed.RefreshToken).ShouldNot(Equal(resp.RefreshToken))
		_, err = authService.RefreshToken(ctx, refreshed.RefreshToken)
		Expect(err).Should(BeNil())
	})

	It("does not take a refresh token as an access token, or the reverse", func() {
		resp := login()
		_, _, err := authService.ValidateToken(ctx, resp.RefreshToken, GrantTypeAccess)
		Expect(err).Should(Equal(bcode.ErrNotAccessToken))
		_, err = authService.RefreshToken(ctx, resp.AccessToken)
		Expect(err).ShouldNot(BeNil())
	})
})
