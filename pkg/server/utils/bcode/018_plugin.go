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

package bcode

// ErrPluginNotfound means the plugin does't install
var ErrPluginNotfound = NewBcode(404, 18001, "the plugin is not exist")

// ErrIsNotBackendPlugin -
var ErrIsNotBackendPlugin = NewBcode(404, 18002, "the plugin is not backend plugin")

// ErrIsNotProxyBackendPlugin -
var ErrIsNotProxyBackendPlugin = NewBcode(404, 18003, "the plugin is not backend proxy plugin")
