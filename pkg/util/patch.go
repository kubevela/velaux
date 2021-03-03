package util

import (
	"bytes"
	"encoding/json"

	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/kustomize/api/filters/patchstrategicmerge"
	"sigs.k8s.io/kustomize/kyaml/kio"
	"sigs.k8s.io/kustomize/kyaml/yaml"

	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
)

func PatchComponents(original, modified []oamcore.ApplicationComponent) ([]oamcore.ApplicationComponent, error) {
	// TODO: change to use kustomize openapi schema
	// https://github.com/kubernetes-sigs/kustomize/blob/1d524b6fbe27178961657539756acc16c4be2b82/api/krusty/openapicustomschema_test.go#L88

	res := make([]oamcore.ApplicationComponent, 0, len(original))

	for _, c := range original {
		res = append(res, *c.DeepCopy())
	}

	// modify patch
	for i, c1 := range original {
		for _, c2 := range modified {
			if c1.Name != c2.Name {
				continue
			}
			// patch settings
			mod, err := patchJSON(c1.Settings.Raw, c2.Settings.Raw)
			if err != nil {
				return nil, err
			}
			if c2.WorkloadType != "" {
				res[i].WorkloadType = c2.WorkloadType
			}
			res[i].Settings = runtime.RawExtension{Raw: mod}

			// traits: modify patch
			for j, t1 := range c1.Traits {
				for _, t2 := range c2.Traits {
					if t1.Name != t2.Name {
						continue
					}

					mod, err := patchJSON(t1.Properties.Raw, t2.Properties.Raw)
					if err != nil {
						return nil, err
					}
					res[i].Traits[j].Properties = runtime.RawExtension{Raw: mod}
				}
			}

			// traits: addition patch
			for _, t2 := range c2.Traits {
				exists := false
				for _, t1 := range c1.Traits {
					if t1.Name == t2.Name {
						exists = true
						break
					}
				}
				if exists {
					continue
				}
				res[i].Traits = append(res[i].Traits, *t2.DeepCopy())
			}

			// TODO: support `$patch: delete` on traits
		}
	}

	// addition patch
	for _, c2 := range modified {
		exists := false
		for _, c1 := range original {
			if c1.Name == c2.Name {
				exists = true
				break
			}
		}
		if exists {
			continue
		}
		res = append(res, *c2.DeepCopy())
	}

	// TODO: support `$patch: delete` on components

	return res, nil
}

func patchJSON(origin, overlay []byte) ([]byte, error) {
	oriN, err := yaml.ConvertJSONToYamlNode(string(origin))
	if err != nil {
		return nil, err
	}
	ori := oriN.MustString()
	patN, err := yaml.ConvertJSONToYamlNode(string(overlay))
	if err != nil {
		return nil, err
	}
	pat := patN.MustString()
	mod, err := patchYAML(ori, pat)
	if err != nil {
		return nil, err
	}
	obj := map[string]interface{}{}
	err = yaml.Unmarshal([]byte(mod), &obj)
	if err != nil {
		return nil, err
	}
	return json.Marshal(obj)
}

func patchYAML(origin, overlay string) (string, error) {
	patch := yaml.MustParse(overlay)
	f := patchstrategicmerge.Filter{
		Patch: patch,
	}
	var out bytes.Buffer
	rw := kio.ByteReadWriter{
		Reader: bytes.NewBufferString(origin),
		Writer: &out,
	}

	err := kio.Pipeline{
		Inputs:  []kio.Reader{&rw},
		Filters: []kio.Filter{f},
		Outputs: []kio.Writer{&rw},
	}.Execute()
	if err != nil {
		return "", err
	}
	return out.String(), nil
}
