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
	"sync"

	utilnet "k8s.io/apimachinery/pkg/util/net"
)

type warningsKey struct{}

// Warnings collects the warnings the API server returns to the requests made
// with one context, such as an admission webhook's, which it sends as Warning
// headers on an admitted request.
type Warnings struct {
	mu   sync.Mutex
	list []string
}

// WithWarnings returns a context whose requests' warnings are collected.
func WithWarnings(ctx context.Context) (context.Context, *Warnings) {
	w := &Warnings{}
	return context.WithValue(ctx, warningsKey{}, w), w
}

// List returns the warnings collected, each once, in the order they arrived.
func (w *Warnings) List() []string {
	w.mu.Lock()
	defer w.mu.Unlock()
	return append([]string(nil), w.list...)
}

func (w *Warnings) add(text string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	for _, seen := range w.list {
		if seen == text {
			return
		}
	}
	w.list = append(w.list, text)
}

// collectWarnings passes a response's warnings to the collector on its
// request's context. client-go's WarningHandler sees no context, so it cannot
// tell whose request a warning answers.
func collectWarnings(rt http.RoundTripper) http.RoundTripper {
	return roundTripperFunc(func(req *http.Request) (*http.Response, error) {
		resp, err := rt.RoundTrip(req)
		if resp == nil {
			return resp, err
		}
		if w, ok := req.Context().Value(warningsKey{}).(*Warnings); ok {
			warnings, _ := utilnet.ParseWarningHeaders(resp.Header.Values("Warning"))
			for _, warning := range warnings {
				w.add(warning.Text)
			}
		}
		return resp, err
	})
}

type roundTripperFunc func(*http.Request) (*http.Response, error)

func (f roundTripperFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}
