package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"

	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
	"sigs.k8s.io/kustomize/api/filesys"
	"sigs.k8s.io/kustomize/api/konfig"
	"sigs.k8s.io/kustomize/api/krusty"
	"sigs.k8s.io/kustomize/api/resmap"
	"sigs.k8s.io/kustomize/api/types"
	"sigs.k8s.io/kustomize/kyaml/openapi"
)

var _ = oamcore.Application{}

var appyaml = []byte(`
apiVersion: core.oam.dev/v1alpha2
kind: Application
metadata:
  name: example
spec:
  components:
    - name: backend
      type: worker
      settings:
        change: change
        keep: keep
    - name: frontend
      type: server
      settings:
        image: image
      traits:
        - name: sidecar
          properties:
            keep: keep
            change: change
`)

var patchyaml = []byte(`
apiVersion: core.oam.dev/v1alpha2
kind: Application
metadata:
  name: example
spec:
  components:
    - name: new
      settings:
        new: new
    - name: backend
      settings:
        change: done
        new: new
    - name: frontend
      traits:
        - name: sidecar
          properties:
            change: done
            new: new
        - name: new
          properties:
            max: 10
`)

func main() {
	schemaData, err := ioutil.ReadFile("./docs/examples/kustomize/schema.json")
	if err != nil {
		panic(err)
	}
	m, err := Run(filesys.MakeFsInMemory(), schemaData, appyaml, patchyaml)
	if err != nil {
		panic(err)
	}

	b, err := m.AsYaml()
	if err != nil {
		panic(err)
	}
	// object type overriding issue: https://github.com/kubernetes-sigs/kustomize/issues/3677
	fmt.Println(string(b))
}

func Run(fSys filesys.FileSystem, schemaData, appData, patchData []byte) (resmap.ResMap, error) {
	writeKustomize(fSys, `
resources:
- mycr.yaml
openapi:
  path: mycrd_schema.json
patchesStrategicMerge:
- patch.yaml
`)
	fSys.WriteFile("./patch.yaml", patchData)
	fSys.WriteFile("./mycr.yaml", appData)
	if err := fSys.WriteFile("./mycrd_schema.json", schemaData); err != nil {
		return nil, err
	}
	openapi.ResetOpenAPI()
	options := MakeDefaultOptions()
	m, err := krusty.MakeKustomizer(options).Run(fSys, ".")
	if err != nil {
		return nil, err
	}
	return m, nil
}

func writeKustomize(fSys filesys.FileSystem, content string) error {
	return fSys.WriteFile(
		filepath.Join(
			".",
			konfig.DefaultKustomizationFileName()), []byte(`
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
`+content))
}

// MakeDefaultOptions returns a default instance of Options.
func MakeDefaultOptions() *krusty.Options {
	return &krusty.Options{
		DoLegacyResourceSort:   false,
		AddManagedbyLabel:      false,
		LoadRestrictions:       types.LoadRestrictionsRootOnly,
		DoPrune:                false,
		PluginConfig:           konfig.DisabledPluginConfig(),
		UseKyaml:               konfig.FlagEnableKyamlDefaultValue,
		AllowResourceIdChanges: false,
	}
}
