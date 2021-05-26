package services

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/pkg/errors"

	"github.com/labstack/echo/v4"
	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/velacp/pkg/proto/model"
	"github.com/oam-dev/velacp/pkg/runtime"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ListComponentDef list component definitions under cluster
func (s *ClusterService) ListComponentDef(c echo.Context) error {
	clusterName := c.Param("clusterName")
	exist, err := s.checkClusterExist(clusterName)
	if err != nil {
		return err
	}
	if !exist {
		return c.JSON(http.StatusInternalServerError, fmt.Sprintf("cluster %s not existed", clusterName))
	}

	cluster, err := s.store.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	list := &oamcore.ComponentDefinitionList{}
	if err := runtime.List(cli, &client.ListOptions{}, list, list); err != nil {
		return err
	}

	var definitions []*model.Definition
	for _, def := range list.Items {
		definition, err := GenDefinition(cli, def.Name, def.Namespace)
		if err != nil {
			klog.ErrorS(err, "fail to gen definition", "definition", def.Name)
			continue
		}

		definition.Desc = def.GetAnnotations()[types.AnnDescription]
		definitions = append(definitions, definition)
	}

	return c.JSON(http.StatusOK, &model.DefinitionsResponse{
		Definitions: definitions,
	})
}

// ListTraitDef list trait definitions under cluster
func (s *ClusterService) ListTraitDef(c echo.Context) error {
	clusterName := c.Param("clusterName")
	exist, err := s.checkClusterExist(clusterName)
	if err != nil {
		return err
	}
	if !exist {
		return c.JSON(http.StatusInternalServerError, fmt.Sprintf("cluster %s not existed", clusterName))
	}

	cluster, err := s.store.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	list := &oamcore.TraitDefinitionList{}
	if err := runtime.List(cli, &client.ListOptions{}, list, list); err != nil {
		return err
	}

	var definitions []*model.Definition
	for _, def := range list.Items {
		definition, err := GenDefinition(cli, def.Name, def.Namespace)
		if err != nil {
			klog.ErrorS(err, "fail to gen definition", "definition", def.Name)
			continue
		}

		definition.Desc = def.GetAnnotations()[types.AnnDescription]
		definitions = append(definitions, definition)
	}

	return c.JSON(http.StatusOK, &model.DefinitionsResponse{
		Definitions: definitions,
	})
}

// GenDefinition from configmap get definition jsonSchema
func GenDefinition(cli client.Client, name, namespace string) (*model.Definition, error) {
	cm := &corev1.ConfigMap{}
	cmName := fmt.Sprintf("%s%s", types.CapabilityConfigMapNamePrefix, name)
	if err := runtime.Get(cli, cm, cm, cmName, namespace); err != nil {
		return nil, errors.Wrap(err, "fail to get definition from configmap")
	}
	klog.InfoS("success to get def from cm", "cm", cmName, cm.Data)

	jsonSchema, err := json.Marshal(cm.Data[types.OpenapiV3JSONSchema])
	if err != nil {
		return nil, errors.Wrap(err, "fail to marshal definition to string")
	}

	return &model.Definition{
		Name:       name,
		JsonSchema: string(jsonSchema),
	}, nil
}
