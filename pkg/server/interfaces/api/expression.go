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
	"strconv"

	restfulspec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"

	"github.com/oam-dev/kubevela/pkg/oam"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// expression serves $( ) expression editing for an application that does not
// exist yet, as the new application dialog writes its first component: the
// context a component reads, and no sources, which are added once it exists.
//
// It reads no application, only the schema of the context, so like the
// definitions API it asks for a signed-in user and no permission.
type expression struct {
	ExpressionService service.ExpressionService `inject:""`
}

// NewExpression is the API for expressions in an application being created.
func NewExpression() Interface {
	return &expression{}
}

func (e *expression) GetWebServiceRoute() *restful.WebService {
	ws := new(restful.WebService)
	ws.Path(versionPrefix+"/expressions").
		Consumes(restful.MIME_XML, restful.MIME_JSON).
		Produces(restful.MIME_JSON, restful.MIME_XML).
		Doc("api for $( ) expressions in an application being created")

	tags := []string{"application"}

	ws.Route(ws.GET("/env").To(e.env).
		Doc("what a $( ) expression in an application being created can read on a surface").
		Param(ws.QueryParameter("surface", "component, trait, workflowstep or source").DataType("string").Required(true)).
		Param(ws.QueryParameter("optIn", "whether the application will read expressions").DataType("boolean")).
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Returns(200, "OK", apis.ExpressionEnvResponse{}).
		Returns(400, "Bad Request", bcode.Bcode{}).
		Writes(apis.ExpressionEnvResponse{}))

	ws.Route(ws.POST("/check").To(e.check).
		Doc("check the $( ) expressions of a property value in an application being created").
		Metadata(restfulspec.KeyOpenAPITags, tags).
		Reads(apis.ExpressionCheckRequest{}).
		Returns(200, "OK", apis.ExpressionCheckResponse{}).
		Returns(400, "Bad Request", bcode.Bcode{}).
		Writes(apis.ExpressionCheckResponse{}))

	return ws
}

// draftApplication stands in for the application being created.
func draftApplication(optIn bool) *model.Application {
	app := &model.Application{}
	if optIn {
		app.Annotations = map[string]string{oam.AnnotationCelExpressions: "true"}
	}
	return app
}

func (e *expression) env(req *restful.Request, res *restful.Response) {
	optIn, _ := strconv.ParseBool(req.QueryParameter("optIn"))
	env, err := e.ExpressionService.Env(req.Request.Context(), draftApplication(optIn), req.QueryParameter("surface"), "")
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(env); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}

func (e *expression) check(req *restful.Request, res *restful.Response) {
	var body apis.ExpressionCheckRequest
	if err := req.ReadEntity(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := validate.Struct(&body); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	checked, err := e.ExpressionService.Check(req.Request.Context(), draftApplication(true), body)
	if err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
	if err := res.WriteEntity(checked); err != nil {
		bcode.ReturnError(req, res, err)
		return
	}
}
