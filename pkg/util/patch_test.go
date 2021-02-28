package util

import (
	"encoding/json"
	"testing"

	"github.com/google/go-cmp/cmp"
	"k8s.io/apimachinery/pkg/runtime"

	velatypes "github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
)

func TestPatch(t *testing.T) {
	var (
		original = []velatypes.ApplicationComponent{{
			Name:     "backend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"original"}`)},
			Traits: []velatypes.ApplicationTrait{{
				Name:       "logging",
				Properties: runtime.RawExtension{Raw: []byte(`{"abc":"123"}`)},
			}},
		}, {
			Name:     "frontend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"myimage2"}`)},
		}}
		modified = []velatypes.ApplicationComponent{{
			Name:     "backend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"myimage"}`)},
			Traits: []velatypes.ApplicationTrait{{
				Name:       "logging",
				Properties: runtime.RawExtension{Raw: []byte(`{"ddd":"123"}`)},
			}},
		}}

		expected = []velatypes.ApplicationComponent{{
			Name:     "backend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"myimage"}`)},
			Traits: []velatypes.ApplicationTrait{{
				Name:       "logging",
				Properties: runtime.RawExtension{Raw: []byte(`{"ddd":"123"}`)},
			}},
		}, {
			Name:     "frontend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"myimage2"}`)},
		}}
	)

	patched, err := patchComponents(original, modified)
	if err != nil {
		t.Fatal(err)
	}
	if diff := cmp.Diff(patched, expected); diff != "" {
		t.Errorf("component not equal:\n%s\n%s\n%s\n", diff, printJson(patched), printJson(expected))
	}
}

func printJson(obj interface{}) string {
	b, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		panic(err)
	}
	return string(b)
}
