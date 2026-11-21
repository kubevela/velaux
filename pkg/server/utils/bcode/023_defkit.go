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

var (
	// ErrDefKitModuleNotExist the module does not exist
	ErrDefKitModuleNotExist = NewBcode(404, 23001, "the DefKit module does not exist")
	// ErrDefKitModuleExist the module already exists
	ErrDefKitModuleExist = NewBcode(400, 23002, "a DefKit module with this name already exists")
	// ErrDefKitAddonDisabled the defkit addon is not enabled
	ErrDefKitAddonDisabled = NewBcode(400, 23003, "enable the defkit addon to install DefKit modules")
	// ErrDefKitNoSource neither a module path nor a git repository was given
	ErrDefKitNoSource = NewBcode(400, 23004, "give a Go module path or a git repository, not both")
	// ErrDefKitNotInReview the module has no render waiting for review
	ErrDefKitNotInReview = NewBcode(400, 23005, "the module has no render waiting for review")
	// ErrDefKitInvalidSettings the deletion policy or interval is not valid
	ErrDefKitInvalidSettings = NewBcode(400, 23006, "a deletion policy is retain or delete, and an interval a duration of at least 5m, such as 10m")
)
