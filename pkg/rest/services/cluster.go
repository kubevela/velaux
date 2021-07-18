package services

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client/config"

	echo "github.com/labstack/echo/v4"
	"github.com/prometheus/common/log"
	"go.mongodb.org/mongo-driver/mongo"
	v1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
	"github.com/oam-dev/velacp/pkg/rest/apis"
	initClient "github.com/oam-dev/velacp/pkg/rest/client"
)

type ClusterService struct {
	store     storeadapter.ClusterStore
	k8sClient client.Client
}

func NewClusterService(store storeadapter.ClusterStore) *ClusterService {
	client, err := initClient.NewK8sClient()
	if err != nil {
		log.Errorf("create client for clusterService failed")
	}
	return &ClusterService{
		store:     store,
		k8sClient: client,
	}
}

func (s *ClusterService) GetClusterNames(c echo.Context) error {
	clusters, err := s.store.ListClusters()
	if err != nil {
		return err
	}
	names := []string{}
	for _, cluster := range clusters {
		names = append(names, cluster.Name)
	}

	return c.JSON(http.StatusOK, apis.ClustersMeta{Clusters: names})
}

func (s *ClusterService) ListClusters(c echo.Context) error {
	clusters, err := s.store.ListClusters()
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.ClusterListResponse{Clusters: clusters})
}

func (s *ClusterService) GetCluster(c echo.Context) error {
	clusterName := c.QueryParam("clusterName")
	ctx := context.Background()
	var cm v1.ConfigMap
	namespace := "default"
	err := s.k8sClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: clusterName}, &cm)
	if err != nil {
		return fmt.Errorf("unable to find configmap parameters in %s:%s ", clusterName, err.Error())
	}
	var cluster model.Cluster
	cluster.Name = cm.Data["Name"]
	cluster.Desc = cm.Data["Desc"]
	cluster.UpdatedAt, err = strconv.ParseInt(strings.Split(cm.Data["UpdatedAt"], "Time:")[1], 10, 64)
	if err != nil {
		return fmt.Errorf("unable to resolve update parameter in %s:%s ", clusterName, err.Error())
	}
	cluster.Kubeconfig = cm.Data["Kubeconfig"]
	return c.JSON(http.StatusOK, model.ClusterResponse{Cluster: &cluster})
}

func (s *ClusterService) AddCluster(c echo.Context) error {
	clusterReq := new(apis.ClusterRequest)
	if err := c.Bind(clusterReq); err != nil {
		return err
	}
	var cm v1.ConfigMap
	namespace := "default"
	ctx := context.Background()
	err := s.k8sClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: clusterReq.Name}, &cm)
	if err != nil && apierrors.IsNotFound(err) {
		// not found
		conf, err := config.GetConfig()
		if err != nil {
			return err
		}
		var cm *v1.ConfigMap
		configdata := map[string]string{
			"Name":      clusterReq.Name,
			"Desc":      clusterReq.Desc,
			"UpdatedAt": time.Now().String(),
			"Kubecofig": conf.String(),
		}
		cm, err = ToConfigMap(clusterReq.Name, "default", configdata)
		if err != nil {
			return fmt.Errorf("convert config map failed %s ", err.Error())
		}
		err = s.k8sClient.Create(ctx, cm)
		if err != nil {
			log.Errorf("Unable to create configmap for %s : %s", clusterReq.Name, err)
		}
	} else {
		// found
		return c.JSON(http.StatusInternalServerError, fmt.Sprintf("cluster %s exist", clusterReq.Name))
	}
	cluster := convertToCluster(clusterReq)
	return c.JSON(http.StatusOK, apis.ClusterMeta{Cluster: &cluster})
}

func (s *ClusterService) UpdateCluster(c echo.Context) error {
	clusterReq := new(apis.ClusterRequest)
	if err := c.Bind(clusterReq); err != nil {
		return err
	}
	cluster := convertToCluster(clusterReq)
	if err := s.store.PutCluster(&cluster); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, apis.ClusterMeta{Cluster: &cluster})
}

func (s *ClusterService) DelCluster(c echo.Context) error {
	clusterName := c.Param("clusterName")
	if err := s.store.DelCluster(clusterName); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, true)
}

// checkClusterExist check whether cluster exist with name
func (s *ClusterService) checkClusterExist(name string) (bool, error) {
	cluster, err := s.store.GetCluster(name)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}
	if len(cluster.Name) != 0 {
		return true, nil
	}
	return false, nil
}

// convertToCluster get cluster model from request
func convertToCluster(clusterReq *apis.ClusterRequest) model.Cluster {
	return model.Cluster{
		Name:       clusterReq.Name,
		Desc:       clusterReq.Desc,
		UpdatedAt:  time.Now().Unix(),
		Kubeconfig: clusterReq.Kubeconfig,
	}
}

func ToConfigMap(name, namespace string, configData map[string]string) (*v1.ConfigMap, error) {
	var cm = v1.ConfigMap{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "v1",
			Kind:       "ConfigMap",
		},
	}
	cm.SetName(name)
	cm.SetNamespace(namespace)
	cm.Data = configData
	return &cm, nil
}
