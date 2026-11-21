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

package api

import (
	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"

	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

type customisation struct {
	CustomisationService service.CustomisationService `inject:""`
	RbacService          service.RBACService          `inject:""`
}

// NewCustomisation is the API for how this VelaUX is branded.
func NewCustomisation() Interface {
	return &customisation{}
}

func (c *customisation) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/customisation").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for the branding of this VelaUX")

	tags := []string{"customisation"}

	// Read without signing in, so the login page is branded too: a logo and
	// a few words are not secret.
	ws.Route(ws.GET("/").To(c.get).
		Doc("the logo and terminology this VelaUX uses").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.Customisation{}).
		Writes(apis.Customisation{}))

	ws.Route(ws.PUT("/").To(c.update).
		Doc("replace the logo and terminology this VelaUX uses").
		Filter(authCheckFilter).
		Filter(c.RbacService.CheckPerm("systemSetting", "update")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.Customisation{}).
		Returns(200, "OK", apis.Customisation{}).
		Returns(400, "Bad Request", bcode.Bcode{}).
		Writes(apis.Customisation{}))

	return ws
}

func (c *customisation) get(req *restful.Request, res *restful.Response) {
	got, err := c.CustomisationService.Get(req.Request.Context())
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(got); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (c *customisation) update(req *restful.Request, res *restful.Response) {
	var body apis.Customisation
	if err := req.ReadEntity(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	updated, err := c.CustomisationService.Update(req.Request.Context(), body)
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(updated); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}
