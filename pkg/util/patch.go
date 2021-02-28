package util

import (
	"encoding/json"

	velatypes "github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/strategicpatch"
)

func patchComponents(original, modified []velatypes.ApplicationComponent) ([]velatypes.ApplicationComponent, error) {
	res := make([]velatypes.ApplicationComponent, 0, len(original))

	for _, c := range original {
		res = append(res, *c.DeepCopy())
	}

	for i, c1 := range original {
		for _, c2 := range modified {
			if c1.Name != c2.Name {
				continue
			}
			// patch settings
			ori, err := json.Marshal(c1.Settings)
			if err != nil {
				return nil, err
			}
			pat, err := json.Marshal(c2.Settings)
			if err != nil {
				return nil, err
			}
			mod, err := strategicMergePatch(ori, pat, &runtime.RawExtension{})
			if err != nil {
				return nil, err
			}
			err = json.Unmarshal(mod, &res[i].Settings)
			if err != nil {
				return nil, err
			}

			// patch traits
			for j, t1 := range c1.Traits {
				for _, t2 := range c2.Traits {
					if t1.Name != t2.Name {
						continue
					}
					ori, err := json.Marshal(t1.Properties)
					if err != nil {
						return nil, err
					}
					pat, err := json.Marshal(t2.Properties)
					if err != nil {
						return nil, err
					}
					mod, err := strategicMergePatch(ori, pat, &runtime.RawExtension{})
					if err != nil {
						return nil, err
					}
					err = json.Unmarshal(mod, &res[i].Traits[j].Properties)
					if err != nil {
						return nil, err
					}

				}
			}
		}
	}

	return res, nil
}

func strategicMergePatch(original, modified []byte, dataStruct interface{}) ([]byte, error) {
	b, err := strategicpatch.CreateTwoWayMergePatch(original, modified, dataStruct)
	if err != nil {
		return nil, err
	}

	res, err := strategicpatch.StrategicMergePatch(original, b, dataStruct)
	if err != nil {
		return nil, err
	}
	return res, nil
}
