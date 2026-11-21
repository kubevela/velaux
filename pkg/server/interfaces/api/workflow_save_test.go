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
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/emicklei/go-restful/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// refusingExpressions refuses every workflow, as the check refuses one with a
// broken expression.
type refusingExpressions struct {
	service.ExpressionService
}

func (refusingExpressions) CheckWorkflow(context.Context, *model.Application, []apis.WorkflowStep, string, string) error {
	return bcode.ErrExpressionInvalid.SetMessage("steps.announce.if: type mismatch")
}

// storeRecorder records whether a workflow reached the store.
type storeRecorder struct {
	service.WorkflowService
	stored bool
}

func (s *storeRecorder) CreateOrUpdateWorkflow(context.Context, *model.Application, apis.CreateWorkflowRequest) (*apis.DetailWorkflowResponse, error) {
	s.stored = true
	return &apis.DetailWorkflowResponse{}, nil
}

func (s *storeRecorder) UpdateWorkflow(context.Context, *model.Workflow, apis.UpdateWorkflowRequest) (*apis.DetailWorkflowResponse, error) {
	s.stored = true
	return &apis.DetailWorkflowResponse{}, nil
}

// serve runs handler on body, with the application and workflow it is routed
// under in the request's context.
func serve(handler restful.RouteFunction, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	r.Header.Set("Content-Type", restful.MIME_JSON)
	ctx := context.WithValue(r.Context(), &apis.CtxKeyApplication, &model.Application{Name: "shop"})
	ctx = context.WithValue(ctx, &apis.CtxKeyWorkflow, &model.Workflow{Name: "workflow-prod", EnvName: "prod"})
	req := restful.NewRequest(r.WithContext(ctx))
	rec := httptest.NewRecorder()
	res := restful.NewResponse(rec)
	res.SetRequestAccepts(restful.MIME_JSON)
	handler(req, res)
	return rec
}

func assertRefused(t *testing.T, rec *httptest.ResponseRecorder, store *storeRecorder) {
	t.Helper()
	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var got bcode.Bcode
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	assert.Equal(t, bcode.ErrExpressionInvalid.BusinessCode, got.BusinessCode)
	assert.False(t, store.stored, "a refused workflow is not stored")
}

func TestWorkflowSavesCheckExpressions(t *testing.T) {
	steps := `"steps":[{"name":"announce","type":"notify","if":"$(context.appName)"}]`

	t.Run("create: a broken expression is refused and nothing is stored", func(t *testing.T) {
		store := &storeRecorder{}
		w := &Workflow{WorkflowService: store, ExpressionService: refusingExpressions{}}
		assertRefused(t, serve(w.createOrUpdateApplicationWorkflow, `{"name":"workflow-prod","envName":"prod",`+steps+`}`), store)
	})

	t.Run("update: a broken expression is refused and nothing is stored", func(t *testing.T) {
		store := &storeRecorder{}
		w := &Workflow{WorkflowService: store, ExpressionService: refusingExpressions{}}
		assertRefused(t, serve(w.updateWorkflow, `{`+steps+`}`), store)
	})

	t.Run("a workflow referencing a shared one has no steps to check", func(t *testing.T) {
		store := &storeRecorder{}
		w := &Workflow{WorkflowService: store, ExpressionService: refusingExpressions{}}
		rec := serve(w.updateWorkflow, `{"ref":"standard"}`)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.True(t, store.stored)
	})
}
