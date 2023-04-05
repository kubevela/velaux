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

package api

import (
	"context"
	"net/http"
	"strings"

	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"

	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

type authentication struct {
	AuthenticationService service.AuthenticationService `inject:""`
	UserService           service.UserService           `inject:""`
}

// NewAuthentication is the  of authentication
func NewAuthentication() Interface {
	return &authentication{}
}

func (c *authentication) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/auth").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for authentication manage")

	tags := []string{"authentication"}

	ws.Route(ws.POST("/login").To(c.login).
		Doc("handle login request").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.LoginRequest{}).
		Returns(200, "", apis.LoginResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.LoginResponse{}))

	ws.Route(ws.GET("/dex_config").To(c.getDexConfig).
		Doc("get Dex config").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "", apis.DexConfigResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.DexConfigResponse{}))

	ws.Route(ws.GET("/refresh_token").To(c.refreshToken).
		Doc("refresh token").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "", apis.RefreshTokenResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.RefreshTokenResponse{}))

	ws.Route(ws.GET("/login_type").To(c.getLoginType).
		Doc("get login type").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "", apis.GetLoginTypeResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.GetLoginTypeResponse{}))

	ws.Route(ws.GET("/user_info").To(c.getLoginUserInfo).
		Doc("get login user detail info").
		Filter(authCheckFilter).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "", apis.LoginUserInfoResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.LoginUserInfoResponse{}))

	ws.Route(ws.GET("/admin_configured").To(c.adminConfigured).
		Doc("check admin is configured").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "", apis.AdminConfiguredResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.AdminConfiguredResponse{}))

	ws.Route(ws.PUT("/init_admin").To(c.configureAdmin).
		Doc("initialize admin").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.InitAdminRequest{}).
		Returns(200, "", apis.InitAdminResponse{}).
		Returns(400, "", bcode.Bcode{}).
		Writes(apis.InitAdminResponse{}))

	return ws
}

func authCheckFilter(req *restful.Request, res *restful.Response, chain *restful.FilterChain) {
	if authTokenCheck(req.Request, res.ResponseWriter) {
		chain.ProcessFilter(req, res)
	}
}
func authTokenCheck(req *http.Request, res http.ResponseWriter) bool {
	// support getting the token from the cookie
	var tokenValue string
	tokenHeader := req.Header.Get("Authorization")
	if tokenHeader != "" {
		splitted := strings.Split(tokenHeader, " ")
		if len(splitted) != 2 {
			bcode.ReturnHTTPError(req, res, bcode.ErrNotAuthorized)
			return false
		}
		tokenValue = splitted[1]
	}
	if tokenValue == "" {
		if strings.HasPrefix(req.URL.Path, "/view") {
			tokenValue = req.URL.Query().Get("token")
		}
		if tokenValue == "" {
			bcode.ReturnHTTPError(req, res, bcode.ErrNotAuthorized)
			return false
		}
	}
	token, err := service.ParseToken(tokenValue)
	if err != nil {
		bcode.ReturnHTTPError(req, res, err)
		return false
	}
	if token.GrantType != service.GrantTypeAccess {
		bcode.ReturnHTTPError(req, res, bcode.ErrNotAccessToken)
		return false
	}
	newReq := req.WithContext(context.WithValue(req.Context(), &apis.CtxKeyUser, token.Username))
	newReq = newReq.WithContext(context.WithValue(newReq.Context(), &apis.CtxKeyToken, tokenValue))
	*req = *newReq
	return true
}

// AuthTokenCheck Parse the token from the request
func AuthTokenCheck(req *http.Request, res http.ResponseWriter, chain *utils.FilterChain) {
	if authTokenCheck(req, res) {
		chain.ProcessFilter(req, res)
	}
}

// AuthUserCheck Checking the login user
func AuthUserCheck(userService service.UserService) func(req *http.Request, res http.ResponseWriter, chain *utils.FilterChain) {
	return func(req *http.Request, res http.ResponseWriter, chain *utils.FilterChain) {
		// get login user info
		userName, ok := req.Context().Value(&apis.CtxKeyUser).(string)
		if !ok {
			bcode.ReturnHTTPError(req, res, bcode.ErrUnauthorized)
			return
		}
		user, err := userService.GetUser(req.Context(), userName)
		if err != nil {
			bcode.ReturnHTTPError(req, res, bcode.ErrUnauthorized)
			return
		}
		req = req.WithContext(context.WithValue(req.Context(), &apis.CtxKeyUserModel, user))
		chain.ProcessFilter(req, res)
	}
}

func (c *authentication) login(req *restful.Request, res *restful.Response) {
	var loginReq apis.LoginRequest
	if err := req.ReadEntity(&loginReq); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	base, err := c.AuthenticationService.Login(req.Request.Context(), loginReq)
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(base); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *authentication) getDexConfig(req *restful.Request, res *restful.Response) {
	base, err := c.AuthenticationService.GetDexConfig(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(base); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *authentication) refreshToken(req *restful.Request, res *restful.Response) {
	base, err := c.AuthenticationService.RefreshToken(req.Request.Context(), req.HeaderParameter("RefreshToken"))
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(base); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *authentication) getLoginType(req *restful.Request, res *restful.Response) {
	base, err := c.AuthenticationService.GetLoginType(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(base); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *authentication) getLoginUserInfo(req *restful.Request, res *restful.Response) {
	info, err := c.UserService.DetailLoginUserInfo(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(info); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *authentication) adminConfigured(req *restful.Request, res *restful.Response) {
	info, err := c.UserService.AdminConfigured(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(info); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *authentication) configureAdmin(req *restful.Request, res *restful.Response) {
	// check if admin is configured
	var reqBody apis.InitAdminRequest
	if err := req.ReadEntity(&reqBody); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := validate.Struct(&reqBody); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	resp, err := c.UserService.InitAdmin(req.Request.Context(), reqBody)
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err = res.WriteEntity(resp); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}
