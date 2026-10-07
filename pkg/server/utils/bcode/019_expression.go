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

package bcode

// ErrExpressionSurface is returned for a surface expressions cannot be written on.
var ErrExpressionSurface = NewBcode(400, 19001, "expressions cannot be written on this surface")

// ErrExpressionsDisabled is returned when this server does not offer expressions.
var ErrExpressionsDisabled = NewBcode(400, 19002, "expressions are not enabled on this server; start it with --enable-cel-expressions")
