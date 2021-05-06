package runtime

import (
	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/velacp/pkg/proto/model"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

const (
	DefaultNamespace = "default"
)

func ParseCoreApplication(obj *model.Application) (oamcore.Application, error) {
	var components []oamcore.ApplicationComponent
	app := NewApplication(obj.Name, obj.Namespace)
	for _, objComponent := range obj.GetComponents() {
		properties, err := objComponent.Properties.MarshalJSON()
		if err != nil {
			return app, err
		}

		var traits []oamcore.ApplicationTrait
		for _, objTrait := range objComponent.Traits {
			properties, err := objTrait.Properties.MarshalJSON()
			if err != nil {
				return app, err
			}
			trait := oamcore.ApplicationTrait{
				Type: objTrait.Type,
				Properties: runtime.RawExtension{
					Raw: properties,
				},
			}

			traits = append(traits, trait)
		}

		component := oamcore.ApplicationComponent{
			Name: objComponent.Name,
			Type: objComponent.Type,
			Properties: runtime.RawExtension{
				Raw: properties,
			},
			Traits: traits,
		}
		components = append(components, component)
	}
	app.Spec.Components = components

	return app, nil
}

func NewApplication(name, namespace string) oamcore.Application {
	if len(namespace) == 0 {
		namespace = DefaultNamespace
	}

	return oamcore.Application{
		ObjectMeta: v1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
	}
}
