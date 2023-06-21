/*
Copyright 2021 The KubeVela Authors.

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

package service

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"
	v12 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kubevela/pkg/util/rand"
	prismclusterv1alpha1 "github.com/kubevela/prism/pkg/apis/cluster/v1alpha1"
	"github.com/oam-dev/terraform-controller/api/v1beta1"

	"github.com/oam-dev/kubevela/pkg/multicluster"
	"github.com/oam-dev/kubevela/pkg/utils"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/clients"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apis "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	utils2 "github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

// ClusterService cluster manage
type ClusterService interface {
	ListKubeClusters(context.Context, string, int, int) (*apis.ListClusterResponse, error)
	CreateKubeCluster(context.Context, apis.CreateClusterRequest) (*apis.ClusterBase, error)
	GetKubeCluster(context.Context, string) (*apis.DetailClusterResponse, error)
	ModifyKubeCluster(context.Context, apis.CreateClusterRequest, string) (*apis.ClusterBase, error)
	DeleteKubeCluster(context.Context, string) (*apis.ClusterBase, error)

	CreateClusterNamespace(context.Context, string, apis.CreateClusterNamespaceRequest) (*apis.CreateClusterNamespaceResponse, error)

	ListCloudClusters(context.Context, string, apis.AccessKeyRequest, int, int) (*apis.ListCloudClusterResponse, error)
	ConnectCloudCluster(context.Context, string, apis.ConnectCloudClusterRequest) (*apis.ClusterBase, error)
	CreateCloudCluster(context.Context, string, apis.CreateCloudClusterRequest) (*apis.CreateCloudClusterResponse, error)
	GetCloudClusterCreationStatus(context.Context, string, string) (*apis.CreateCloudClusterResponse, error)
	ListCloudClusterCreation(context.Context, string) (*apis.ListCloudClusterCreationResponse, error)
	DeleteCloudClusterCreation(context.Context, string, string) (*apis.CreateCloudClusterResponse, error)
	Init(ctx context.Context) error
}

type clusterServiceImpl struct {
	Store      datastore.DataStore `inject:"datastore"`
	K8sClient  client.Client       `inject:"kubeClient"`
	KubeConfig *rest.Config        `inject:"kubeConfig"`
	caches     *utils2.MemoryCacheStore
}

// NewClusterService new cluster service
func NewClusterService() ClusterService {
	c := &clusterServiceImpl{caches: utils2.NewMemoryCacheStore(context.Background())}
	return c
}

func (c *clusterServiceImpl) Init(ctx context.Context) error {
	return c.preAddLocalCluster(ctx)
}

func _getClusterFromDataStore(ctx context.Context, ds datastore.DataStore, clusterName string) (*model.Cluster, error) {
	cluster := &model.Cluster{Name: clusterName}
	if err := ds.Get(ctx, cluster); err != nil {
		return nil, err
	}
	return cluster, nil
}

func (c *clusterServiceImpl) getClusterFromDataStore(ctx context.Context, clusterName string) (*model.Cluster, error) {
	return _getClusterFromDataStore(ctx, c.Store, clusterName)
}

func (c *clusterServiceImpl) rollbackAddedClusterInDataStore(ctx context.Context, cluster *model.Cluster) {
	if e := c.Store.Delete(ctx, cluster); e != nil {
		klog.Errorf("failed to rollback added cluster %s in data store: %s", utils.Sanitize(cluster.Name), e.Error())
	}
}

func (c *clusterServiceImpl) rollbackDeletedClusterInDataStore(ctx context.Context, cluster *model.Cluster) {
	if e := c.Store.Add(ctx, cluster); e != nil {
		klog.Errorf("failed to rollback deleted cluster %s in data store: %s", utils.Sanitize(cluster.Name), e.Error())
	}
}

func (c *clusterServiceImpl) rollbackJoinedKubeCluster(ctx context.Context, cluster *model.Cluster) {
	if e := multicluster.DetachCluster(ctx, c.K8sClient, cluster.Name); e != nil {
		klog.Errorf("failed to rollback joined cluster %s in kubevela: %s", utils.Sanitize(cluster.Name), e.Error())
	}
}

func (c *clusterServiceImpl) rollbackDetachedKubeCluster(ctx context.Context, cluster *model.Cluster) {
	if _, e := joinClusterByKubeConfigString(context.WithValue(ctx, multicluster.KubeConfigContext, c.KubeConfig), c.K8sClient, cluster.Name, cluster.KubeConfig); e != nil {
		klog.Errorf("failed to rollback detached cluster %s in kubevela: %s", utils.Sanitize(cluster.Name), e.Error())
	}
}

func (c *clusterServiceImpl) preAddLocalCluster(ctx context.Context) error {
	cfg, err := clients.GetKubeConfig()
	if err != nil {
		return err
	}
	localCluster := &model.Cluster{
		Name:         multicluster.ClusterLocalName,
		Description:  "The hub manage cluster where KubeVela runs on.",
		Status:       model.ClusterStatusHealthy,
		APIServerURL: cfg.Host + cfg.APIPath,
	}
	if err = c.Store.Get(ctx, localCluster); err != nil {
		// no local cluster in datastore
		if errors.Is(err, datastore.ErrRecordNotExist) {
			if err = c.Store.Add(ctx, localCluster); err != nil {
				// local cluster already added in datastore
				if errors.Is(err, datastore.ErrRecordExist) {
					return nil
				}
				return err
			}
			return nil
		}
		return err
	}
	if localCluster.CreateTime.Before(model.LocalClusterCreatedTime) {
		localCluster.CreateTime = model.LocalClusterCreatedTime
		if err = c.Store.Put(ctx, localCluster); err != nil {
			return err
		}
	}
	return nil
}

func (c *clusterServiceImpl) ListKubeClusters(ctx context.Context, query string, page int, pageSize int) (*apis.ListClusterResponse, error) {
	clusters, err := prismclusterv1alpha1.NewClusterClient(c.K8sClient).List(ctx)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get clusters with ClusterClient")
	}
	clustersInfo, err := c.Store.List(ctx, &model.Cluster{}, nil)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to list cluster in data store")
	}
	clustersInfoMap := make(map[string]*model.Cluster)
	for _, raw := range clustersInfo {
		if clusterInfo, ok := raw.(*model.Cluster); ok {
			clustersInfoMap[clusterInfo.Name] = clusterInfo
		}
	}
	resp := &apis.ListClusterResponse{Clusters: []apis.ClusterBase{}, Total: int64(len(clusters.Items))}
	for _, cluster := range clusters.Items {
		if !strings.Contains(cluster.Name, query) {
			continue
		}
		var clusterModel *model.Cluster
		if clusterInfo, exists := clustersInfoMap[cluster.Name]; exists {
			clusterModel = clusterInfo
		} else {
			clusterModel = newClusterModelFromPrismCluster(cluster.DeepCopy())
		}
		resp.Clusters = append(resp.Clusters, *newClusterBaseFromCluster(clusterModel))
	}
	if page <= 0 {
		return resp, nil
	}
	begin, end := (page-1)*pageSize, page*pageSize
	if begin >= len(resp.Clusters) {
		resp.Clusters = []apis.ClusterBase{}
	} else {
		if end > len(resp.Clusters) {
			end = len(resp.Clusters)
		}
		resp.Clusters = resp.Clusters[begin:end]
	}
	return resp, nil
}

func joinClusterByKubeConfigString(ctx context.Context, k8sClient client.Client, clusterName string, kubeConfig string) (string, error) {
	tmpFileName := fmt.Sprintf("/tmp/cluster-secret-%s-%d.kubeconfig", rand.RandomString(8), time.Now().UnixNano())
	if err := os.WriteFile(tmpFileName, []byte(kubeConfig), 0600); err != nil {
		return "", errors.Wrapf(err, "failed to write kubeconfig to temp file %s", tmpFileName)
	}
	defer func() {
		_ = os.Remove(tmpFileName)
	}()
	clusterConfig, err := multicluster.JoinClusterByKubeConfig(ctx, k8sClient, tmpFileName, clusterName, multicluster.JoinClusterCreateNamespaceOption(""))
	if err != nil {
		if errors.Is(err, multicluster.ErrClusterExists) {
			return "", bcode.ErrClusterExistsInKubernetes
		}
		return "", errors.Wrapf(err, "failed to join cluster")
	}
	return clusterConfig.Cluster.Server, nil
}

func createClusterModelFromRequest(req apis.CreateClusterRequest, oldCluster *model.Cluster) (newCluster *model.Cluster) {
	if oldCluster != nil {
		newCluster = oldCluster.DeepCopy()
	} else {
		newCluster = &model.Cluster{}
	}
	newCluster.Name = req.Name
	newCluster.Alias = req.Alias
	newCluster.Description = req.Description
	newCluster.Icon = req.Icon
	newCluster.Labels = req.Labels
	newCluster.KubeConfig = req.KubeConfig
	newCluster.KubeConfigSecret = req.KubeConfigSecret
	newCluster.DashboardURL = req.DashboardURL
	return newCluster
}

// createKubeCluster -
// Deprecated
func (c *clusterServiceImpl) createKubeCluster(ctx context.Context, req apis.CreateClusterRequest) (*apis.ClusterBase, error) {
	return nil, nil
}

func (c *clusterServiceImpl) CreateKubeCluster(ctx context.Context, req apis.CreateClusterRequest) (*apis.ClusterBase, error) {
	return c.createKubeCluster(ctx, req)
}

func (c *clusterServiceImpl) GetKubeCluster(ctx context.Context, clusterName string) (*apis.DetailClusterResponse, error) {
	cluster, err := c.getClusterFromDataStore(ctx, clusterName)
	if err != nil {
		if !errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, errors.Wrapf(err, "failed to find cluster %s in data store", clusterName)
		}
		prismCluster, err := prismclusterv1alpha1.NewClusterClient(c.K8sClient).Get(ctx, clusterName)
		if err != nil {
			if kerrors.IsNotFound(err) {
				return nil, bcode.ErrClusterNotFoundInDataStore
			}
			return nil, errors.Wrapf(err, "failed to find cluster %s in control plane", clusterName)
		}
		cluster = newClusterModelFromPrismCluster(prismCluster)
		if err = c.Store.Add(ctx, cluster); err != nil {
			return nil, errors.Wrapf(err, "failed to add cluster %s from existing prism cluster", clusterName)
		}
	}
	resourceInfo := c.setClusterStatusAndResourceInfo(ctx, cluster)
	if err = c.Store.Put(ctx, cluster); err != nil {
		return nil, errors.Wrapf(err, "failed to update cluster %s status info", clusterName)
	}
	return &apis.DetailClusterResponse{
		Cluster:      *cluster,
		ResourceInfo: resourceInfo,
	}, nil
}

func (c *clusterServiceImpl) ModifyKubeCluster(ctx context.Context, req apis.CreateClusterRequest, clusterName string) (*apis.ClusterBase, error) {
	oldCluster, err := c.getClusterFromDataStore(ctx, clusterName)
	if err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, bcode.ErrClusterNotFoundInDataStore
		}
		return nil, errors.Wrapf(err, "failed to found cluster %s in data store", clusterName)
	}

	newCluster := createClusterModelFromRequest(req, oldCluster)
	newCluster.SetUpdateTime(time.Now())
	if oldCluster.Name != newCluster.Name || oldCluster.KubeConfig != newCluster.KubeConfig || oldCluster.KubeConfigSecret != newCluster.KubeConfigSecret {
		if clusterName == multicluster.ClusterLocalName || newCluster.Name == multicluster.ClusterLocalName {
			return nil, bcode.ErrLocalClusterImmutable
		}
		if newCluster.KubeConfig == "" && newCluster.KubeConfigSecret != "" {
			return nil, bcode.ErrKubeConfigSecretNotSupport
		}
		newClusterTempName := newCluster.Name + "_tmp_" + rand.RandomString(8)
		newCluster.APIServerURL, err = joinClusterByKubeConfigString(context.WithValue(ctx, multicluster.KubeConfigContext, c.KubeConfig), c.K8sClient, newCluster.Name, newCluster.KubeConfig)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to join new cluster %s", newCluster.Name)
		}
		c.setClusterStatusAndResourceInfo(ctx, newCluster)
		rollbackTempCluster := func() {
			rollBackCluster := newCluster.DeepCopy()
			rollBackCluster.Name = newClusterTempName
			c.rollbackJoinedKubeCluster(ctx, rollBackCluster)
		}
		if err = multicluster.DetachCluster(ctx, c.K8sClient, oldCluster.Name); err != nil {
			rollbackTempCluster()
			return nil, errors.Wrapf(err, "failed to detach old cluster %s", oldCluster.Name)
		}
		if err = c.Store.Delete(ctx, oldCluster); err != nil {
			rollbackTempCluster()
			c.rollbackDetachedKubeCluster(ctx, oldCluster)
			if errors.Is(err, datastore.ErrRecordNotExist) {
				return nil, bcode.ErrClusterNotFoundInDataStore
			}
			return nil, errors.Wrapf(err, "failed to delete old cluster %s from datastore", oldCluster.Name)
		}
		if err = c.Store.Add(ctx, newCluster); err != nil {
			rollbackTempCluster()
			c.rollbackDetachedKubeCluster(ctx, oldCluster)
			c.rollbackDeletedClusterInDataStore(ctx, oldCluster)
			if errors.Is(err, datastore.ErrRecordExist) {
				return nil, bcode.ErrClusterAlreadyExistInDataStore
			}
			return nil, errors.Wrapf(err, "failed to add new cluster %s to datastore", newCluster.Name)
		}
		if err = multicluster.RenameCluster(ctx, c.K8sClient, newClusterTempName, newCluster.Name); err != nil {
			rollbackTempCluster()
			c.rollbackDetachedKubeCluster(ctx, oldCluster)
			c.rollbackDeletedClusterInDataStore(ctx, oldCluster)
			c.rollbackAddedClusterInDataStore(ctx, newCluster)
			return nil, errors.Wrapf(err, "failed to rename temporary cluster %s to %s", newClusterTempName, newCluster.Name)
		}
	} else {
		newCluster.Status = oldCluster.Status
		newCluster.Reason = oldCluster.Reason
		if err = c.Store.Put(ctx, newCluster); err != nil {
			return nil, errors.Wrapf(err, "failed to update cluster %s", newCluster.Name)
		}
	}
	return newClusterBaseFromCluster(newCluster), nil
}

func (c *clusterServiceImpl) DeleteKubeCluster(ctx context.Context, clusterName string) (*apis.ClusterBase, error) {
	if clusterName == multicluster.ClusterLocalName {
		return nil, bcode.ErrLocalClusterImmutable
	}
	cluster, err := c.getClusterFromDataStore(ctx, clusterName)
	if err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			if err = multicluster.DetachCluster(ctx, c.K8sClient, clusterName); err != nil {
				return nil, bcode.ErrClusterNotFoundInDataStore
			}
			return &apis.ClusterBase{Name: clusterName}, nil
		}
		return nil, errors.Wrapf(err, "failed to found cluster %s in data store", clusterName)
	}
	if err = c.Store.Delete(ctx, cluster); err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, bcode.ErrClusterNotFoundInDataStore
		}
		return nil, errors.Wrapf(err, "failed to delete cluster %s in data store", clusterName)
	}
	if err = multicluster.DetachCluster(ctx, c.K8sClient, clusterName); err != nil {
		c.rollbackDeletedClusterInDataStore(ctx, cluster)
		return nil, errors.Wrapf(err, "failed to delete cluster %s in kubernetes", clusterName)
	}
	return newClusterBaseFromCluster(cluster), nil
}

func (c *clusterServiceImpl) CreateClusterNamespace(ctx context.Context, clusterName string, req apis.CreateClusterNamespaceRequest) (*apis.CreateClusterNamespaceResponse, error) {
	_, err := c.getClusterFromDataStore(ctx, clusterName)
	if err != nil {
		if !errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, errors.Wrapf(err, "failed to find cluster %s in data store", clusterName)
		}
		prismCluster, err := prismclusterv1alpha1.NewClusterClient(c.K8sClient).Get(ctx, clusterName)
		if err != nil {
			if kerrors.IsNotFound(err) {
				return nil, bcode.ErrClusterNotFoundInDataStore
			}
			return nil, errors.Wrapf(err, "failed to find cluster %s in control plane", clusterName)
		}
		cluster := newClusterModelFromPrismCluster(prismCluster)
		if err = c.Store.Add(ctx, cluster); err != nil {
			return nil, errors.Wrapf(err, "failed to add cluster %s from existing prism cluster", clusterName)
		}
	}
	ns := &v12.Namespace{}
	ns.Name = req.Namespace
	if err = c.K8sClient.Create(multicluster.ContextWithClusterName(ctx, clusterName), ns); err != nil {
		if kerrors.IsAlreadyExists(err) {
			return &apis.CreateClusterNamespaceResponse{Exists: true}, nil
		}
		if kerrors.IsForbidden(err) {
			return nil, bcode.ErrClusterCreateNamespaceNoPermission
		}
		return nil, errors.Wrapf(err, "failed to create namespace %s in cluster %s", req.Namespace, clusterName)
	}
	return &apis.CreateClusterNamespaceResponse{Exists: false}, nil
}

func (c *clusterServiceImpl) setClusterStatusAndResourceInfo(ctx context.Context, cluster *model.Cluster) apis.ClusterResourceInfo {
	resourceInfo, err := c.getClusterResourceInfoFromK8s(ctx, cluster.Name)
	if err != nil {
		cluster.Status = model.ClusterStatusUnhealthy
		cluster.Reason = fmt.Sprintf("Failed to get cluster resource info: %s", err.Error())
	} else {
		cluster.Status = model.ClusterStatusHealthy
		cluster.Reason = ""
	}
	return resourceInfo
}

func (c *clusterServiceImpl) getClusterResourceInfoCacheKey(clusterName string) string {
	return "cluster-resource-info::" + clusterName
}

func (c *clusterServiceImpl) getClusterResourceInfoFromK8s(ctx context.Context, clusterName string) (apis.ClusterResourceInfo, error) {
	cacheKey := c.getClusterResourceInfoCacheKey(clusterName)
	if cache := c.caches.Get(cacheKey); cache != nil {
		return cache.(apis.ClusterResourceInfo), nil
	}
	clusterInfo, err := multicluster.GetClusterInfo(ctx, c.K8sClient, clusterName)
	if err != nil {
		return apis.ClusterResourceInfo{}, err
	}
	var storageClassList []string
	for _, cls := range clusterInfo.StorageClasses.Items {
		storageClassList = append(storageClassList, cls.Name)
	}
	getUsed := func(cap resource.Quantity, alloc resource.Quantity) *resource.Quantity {
		used := cap.DeepCopy()
		used.Sub(alloc)
		return &used
	}
	// TODO add support for gpu capacity
	clusterResourceInfo := apis.ClusterResourceInfo{
		WorkerNumber:     clusterInfo.WorkerNumber,
		MasterNumber:     clusterInfo.MasterNumber,
		MemoryCapacity:   clusterInfo.MemoryCapacity.Value(),
		CPUCapacity:      clusterInfo.CPUCapacity.Value(),
		GPUCapacity:      0,
		PodCapacity:      clusterInfo.PodCapacity.Value(),
		MemoryUsed:       getUsed(clusterInfo.MemoryCapacity, clusterInfo.MemoryAllocatable).Value(),
		CPUUsed:          getUsed(clusterInfo.CPUCapacity, clusterInfo.CPUAllocatable).Value(),
		GPUUsed:          0,
		PodUsed:          getUsed(clusterInfo.PodCapacity, clusterInfo.PodAllocatable).Value(),
		StorageClassList: storageClassList,
	}
	c.caches.Put(cacheKey, clusterResourceInfo, time.Minute)
	return clusterResourceInfo, nil
}

// ListCloudClusters -
// Deprecated
func (c *clusterServiceImpl) ListCloudClusters(ctx context.Context, provider string, req apis.AccessKeyRequest, pageNumber int, pageSize int) (*apis.ListCloudClusterResponse, error) {
	return nil, nil
}

// ConnectCloudCluster
// Deprecated
func (c *clusterServiceImpl) ConnectCloudCluster(ctx context.Context, provider string, req apis.ConnectCloudClusterRequest) (*apis.ClusterBase, error) {
	return nil, nil
}

// CreateCloudCluster
// Deprecated
func (c *clusterServiceImpl) CreateCloudCluster(ctx context.Context, provider string, req apis.CreateCloudClusterRequest) (*apis.CreateCloudClusterResponse, error) {
	return nil, nil
}

// getCloudClusterCreationStatus -
// Deprecated
func (c *clusterServiceImpl) getCloudClusterCreationStatus(ctx context.Context, provider string, cloudClusterName string) (*apis.CreateCloudClusterResponse, *v1beta1.Configuration, error) {
	return nil, nil, nil
}

func (c *clusterServiceImpl) GetCloudClusterCreationStatus(ctx context.Context, provider string, cloudClusterName string) (*apis.CreateCloudClusterResponse, error) {
	resp, _, err := c.getCloudClusterCreationStatus(ctx, provider, cloudClusterName)
	return resp, err
}

// ListCloudClusterCreation -
// Deprecated
func (c *clusterServiceImpl) ListCloudClusterCreation(ctx context.Context, provider string) (*apis.ListCloudClusterCreationResponse, error) {
	return nil, nil
}

func (c *clusterServiceImpl) DeleteCloudClusterCreation(ctx context.Context, provider string, cloudClusterName string) (*apis.CreateCloudClusterResponse, error) {
	resp, cfg, err := c.getCloudClusterCreationStatus(ctx, provider, cloudClusterName)
	if err != nil {
		return resp, err
	}
	if err = c.K8sClient.Delete(ctx, cfg); err != nil {
		if kerrors.IsNotFound(err) {
			return resp, nil
		}
		return nil, err
	}
	return resp, err
}

func newClusterBaseFromCluster(cluster *model.Cluster) *apis.ClusterBase {
	return &apis.ClusterBase{
		Name:        cluster.Name,
		Alias:       cluster.Alias,
		Description: cluster.Description,
		Icon:        cluster.Icon,
		Labels:      cluster.Labels,

		APIServerURL: cluster.APIServerURL,
		DashboardURL: cluster.DashboardURL,
		Provider:     cluster.Provider,

		Status: cluster.Status,
		Reason: cluster.Reason,
	}
}

func newClusterModelFromPrismCluster(cluster *prismclusterv1alpha1.Cluster) *model.Cluster {
	return &model.Cluster{
		BaseModel:    model.BaseModel{CreateTime: cluster.GetCreationTimestamp().Time},
		Name:         cluster.Name,
		Alias:        cluster.Spec.Alias,
		Labels:       cluster.Labels,
		APIServerURL: cluster.Spec.Endpoint,
	}
}
