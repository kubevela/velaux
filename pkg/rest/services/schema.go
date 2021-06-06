package services

import (
	"context"
	"net/http"

	"github.com/oam-dev/velacp/pkg/proto/model"

	"github.com/oam-dev/velacp/pkg/common"

	"github.com/labstack/echo/v4"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/runtime"
	"github.com/pkg/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type SchemaService struct {
	clusterStore storeadapter.ClusterStore
}

func NewSchemaService(clusterStore storeadapter.ClusterStore) *SchemaService {
	return &SchemaService{
		clusterStore: clusterStore,
	}
}

func (s *SchemaService) GetWorkloadSchema(c echo.Context) error {
	definitionName := c.QueryParam("name")
	definitionNamespace := c.QueryParam("namespace")
	definitionType := c.QueryParam("type")

	clusterName := c.Param("cluster")
	cluster, err := s.clusterStore.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	key := client.ObjectKey{Namespace: definitionNamespace, Name: definitionName}
	definition, err := GenDefinitionObj(definitionName, definitionType)
	if err != nil {
		return err
	}

	if err := cli.Get(context.Background(), key, definition); err != nil {
		return err
	}

	parse := common.NewParseReference(cli)
	schema, err := parse.ParseDefinition(definition, definitionName, definitionNamespace)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, &model.DefinitionsResponse{
		Definitions: []*model.Definition{schema},
	})
}

func GenDefinitionObj(name, wType string) (*unstructured.Unstructured, error) {
	obj := &unstructured.Unstructured{}
	obj.SetName(name)
	switch wType {
	case "workload":
		obj.SetGroupVersionKind(v1alpha2.WorkloadDefinitionGroupVersionKind)
	case "trait":
		obj.SetGroupVersionKind(v1alpha2.TraitDefinitionGroupVersionKind)
	case "component":
		obj.SetGroupVersionKind(v1alpha2.ComponentDefinitionGroupVersionKind)
	default:
		return nil, errors.Errorf("not found definition %s", wType)
	}

	return obj, nil
}
