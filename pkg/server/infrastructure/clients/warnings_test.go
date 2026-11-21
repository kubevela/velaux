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

package clients

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCollectWarnings(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Add("Warning", `299 - "ComponentDefinition \"webservice\" in namespace \"dev\" is using 4 of 5."`)
		w.Header().Add("Warning", `299 - "second warning"`)
		w.Header().Add("Warning", `299 - "second warning"`)
	}))
	defer server.Close()
	transport := collectWarnings(http.DefaultTransport)

	get := func(ctx context.Context) {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, server.URL, nil)
		require.NoError(t, err)
		resp, err := transport.RoundTrip(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
	}

	t.Run("collects the request's warnings once each", func(t *testing.T) {
		ctx, warnings := WithWarnings(context.Background())
		get(ctx)
		assert.Equal(t, []string{
			`ComponentDefinition "webservice" in namespace "dev" is using 4 of 5.`,
			"second warning",
		}, warnings.List())
	})

	t.Run("passes a request with no collector through", func(_ *testing.T) {
		get(context.Background())
	})

	t.Run("keeps each collector to its own requests", func(t *testing.T) {
		ctx, warnings := WithWarnings(context.Background())
		_, other := WithWarnings(context.Background())
		get(ctx)
		assert.Len(t, warnings.List(), 2)
		assert.Empty(t, other.List())
	})
}
