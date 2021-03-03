package util

import (
	"encoding/json"
	"testing"

	"github.com/google/go-cmp/cmp"
	"k8s.io/apimachinery/pkg/runtime"

	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
)

func TestPatch(t *testing.T) {
	var (
		original = []oamcore.ApplicationComponent{{
			Name:     "backend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"original","additional":"keep"}`)},
			Traits: []oamcore.ApplicationTrait{{
				Name:       "logging",
				Properties: runtime.RawExtension{Raw: []byte(`{"abc":"123"}`)},
			}},
		}}
		modified = []oamcore.ApplicationComponent{{
			Name:     "backend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"newimage"}`)},
			Traits: []oamcore.ApplicationTrait{{
				Name:       "logging",
				Properties: runtime.RawExtension{Raw: []byte(`{"ddd":"123"}`)},
			}, {
				Name:       "autoscaling",
				Properties: runtime.RawExtension{Raw: []byte(`{"ddd":"123"}`)},
			}},
		}, {
			Name:     "frontend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"myimage2"}`)},
		}}

		expected = []oamcore.ApplicationComponent{{
			Name:     "backend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"newimage","additional":"keep"}`)},
			Traits: []oamcore.ApplicationTrait{{
				Name:       "logging",
				Properties: runtime.RawExtension{Raw: []byte(`{"abc":"123","ddd":"123"}`)},
			}, {
				Name:       "autoscaling",
				Properties: runtime.RawExtension{Raw: []byte(`{"ddd":"123"}`)},
			}},
		}, {
			Name:     "frontend",
			Settings: runtime.RawExtension{Raw: []byte(`{"image":"myimage2"}`)},
		}}
	)

	patched, err := PatchComponents(original, modified)
	if err != nil {
		t.Fatal(err)
	}
	if diff := compareComponents(patched, expected); diff != "" {
		t.Errorf("component not equal:\n%s\n%s\n%s\n", diff, printJson(patched), printJson(expected))
	}
}

func compareComponents(l1, l2 []oamcore.ApplicationComponent) string {
	if diff := cmp.Diff(len(l1), len(l2)); diff != "" {
		return "comp length:" + diff
	}
	for i, c1 := range l1 {
		c2 := l2[i]

		if diff := cmp.Diff(c1.Name, c2.Name); diff != "" {
			return diff
		}

		m1 := map[string]interface{}{}
		m2 := map[string]interface{}{}
		err := json.Unmarshal(c1.Settings.Raw, &m1)
		if err != nil {
			panic(err)
		}
		err = json.Unmarshal(c2.Settings.Raw, &m2)
		if err != nil {
			panic(err)
		}
		if diff := cmp.Diff(m1, m2); diff != "" {
			return diff
		}

		if diff := cmp.Diff(len(c1.Traits), len(c2.Traits)); diff != "" {
			return "traits length:" + diff
		}
		for j, t1 := range c1.Traits {
			t2 := c2.Traits[j]

			if diff := cmp.Diff(t1.Name, t2.Name); diff != "" {
				return diff
			}

			m1 := map[string]interface{}{}
			m2 := map[string]interface{}{}
			err := json.Unmarshal(t1.Properties.Raw, &m1)
			if err != nil {
				panic(err)
			}
			err = json.Unmarshal(t2.Properties.Raw, &m2)
			if err != nil {
				panic(err)
			}
			if diff := cmp.Diff(m1, m2); diff != "" {
				return diff
			}
		}
	}
	return ""
}

func printJson(obj interface{}) string {
	b, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		panic(err)
	}
	return string(b)
}
