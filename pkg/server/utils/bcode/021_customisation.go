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

// ErrInvalidCustomisation means a customisation VelaUX could not apply: a logo
// that is no http(s) or data URL, or a term that is not a single capitalised
// word with a singular and a plural.
var ErrInvalidCustomisation = NewBcode(400, 21001, "the customisation is not valid")
