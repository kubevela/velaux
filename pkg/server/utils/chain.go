/*
Copyright 2023 The KubeVela Authors.

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

package utils

import "net/http"

// NewFilterChain create a filter chain
func NewFilterChain(target RouteFunction, filters ...FilterFunction) *FilterChain {
	return &FilterChain{
		filters: filters,
		target:  target,
		index:   0,
	}
}

// FilterChain the filter to handle the http request
type FilterChain struct {
	filters []FilterFunction // ordered list of FilterFunction
	index   int              // index into filters that is currently in progress
	target  RouteFunction    // function to call after passing all filters
}

// FilterFunction definitions must call ProcessFilter on the FilterChain to pass on the control and eventually call the RouteFunction
type FilterFunction func(*http.Request, http.ResponseWriter, *FilterChain)

// RouteFunction declares the signature of a function that can be bound to a Route.
type RouteFunction func(*http.Request, http.ResponseWriter)

// ProcessFilter passes the request,response pair through the next of Filters.
// Each filter can decide to proceed to the next Filter or handle the Response itself.
func (f *FilterChain) ProcessFilter(request *http.Request, response http.ResponseWriter) {
	if f.index < len(f.filters) {
		f.index++
		f.filters[f.index-1](request, response, f)
	} else {
		f.target(request, response)
	}
}
