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
package report

import (
	"embed"
	"path"
	"strings"
)

//go:embed builtin/*.cue
var builtins embed.FS

// Builtins are the reports VelaUX ships, by name.
func Builtins() map[string]string {
	out := map[string]string{}
	entries, _ := builtins.ReadDir("builtin")
	for _, e := range entries {
		data, err := builtins.ReadFile(path.Join("builtin", e.Name()))
		if err != nil {
			continue
		}
		out[strings.TrimSuffix(e.Name(), ".cue")] = string(data)
	}
	return out
}
