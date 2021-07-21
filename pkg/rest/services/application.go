package services

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	k8sruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/duration"
	yamlutil "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/kubectl/pkg/util/event"
	"sigs.k8s.io/controller-runtime/pkg/client"

	initClient "github.com/oam-dev/velacp/pkg/rest/client"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/utils/apply"

	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
	"github.com/oam-dev/velacp/pkg/runtime"
)

type ApplicationService struct {
	appStore     storeadapter.ApplicationStore
	clusterStore storeadapter.ClusterStore
	k8sClient    client.Client
}

const (
	DefaultUINamespace  = "velaui"
	DefaultAppNamespace = "default"
)

func NewApplicationService(appStore storeadapter.ApplicationStore, clusterStore storeadapter.ClusterStore) (*ApplicationService, error) {
	client, err := initClient.NewK8sClient()
	if err != nil {
		return nil, fmt.Errorf("create client for clusterService failed")
	}
	return &ApplicationService{
		appStore:     appStore,
		clusterStore: clusterStore,
		k8sClient:    client,
	}, nil
}

// GetApplications for get applications from cluster
func (s *ApplicationService) GetApplications(c echo.Context) error {
	// appName := c.QueryParam("appName") // change to get application

	var cmList v1.ConfigMapList
	labels := &metav1.LabelSelector{
		MatchLabels: map[string]string{
			"app": "app.configdata",
		},
	}
	selector, err := metav1.LabelSelectorAsSelector(labels)
	if err != nil {
		return err
	}
	err = s.k8sClient.List(context.Background(), &cmList, &client.ListOptions{
		LabelSelector: selector,
	})
	if err != nil {
		return err
	}
	var appList = make([]*model.Application, len(cmList.Items))
	for i, c := range cmList.Items {
		UpdateInt, err := strconv.ParseInt(cmList.Items[i].Data["UpdatedAt"], 10, 64)
		if err != nil {
			return err
		}
		app := model.Application{
			Name:      c.Name,
			Namespace: c.Namespace,
			Desc:      cmList.Items[i].Data["Desc"],
			UpdatedAt: UpdateInt,
		}
		appList = append(appList, &app)
	}

	return c.JSON(http.StatusOK, model.ApplicationListResponse{
		Applications: appList,
	})
}

func (s *ApplicationService) GetApplicationDetail(c echo.Context) error {
	appName := c.Param("application")
	clusterName := c.Param("cluster")

	var cm v1.ConfigMap
	// k8sClient is a common client for getting configmap info in current cluster.
	err := s.k8sClient.Get(context.Background(), client.ObjectKey{Namespace: DefaultUINamespace, Name: clusterName}, &cm) // cluster configmap info
	if err != nil {
		return fmt.Errorf("unable to find configmap parameters in %s:%s ", clusterName, err.Error())
	}

	// cli is the client running in specific cluster to get specific k8s crd resource.
	cli, err := runtime.GetClient([]byte(cm.Data["Kubeconfig"]))
	if err != nil {
		return err
	}

	var app model.Application
	err = s.k8sClient.Get(context.Background(), client.ObjectKey{Namespace: DefaultUINamespace, Name: appName}, &cm) // application configmap info
	if err != nil {
		return fmt.Errorf("unable to find configmap parameters in %s:%s ", appName, err.Error())
	}

	app.Name = appName
	app.Desc = cm.Data["Desc"]
	app.Namespace = cm.Data["Namespace"]
	app.ClusterName = clusterName
	app.UpdatedAt, err = strconv.ParseInt(cm.Data["UpdatedAt"], 10, 64)
	if err != nil {
		return fmt.Errorf("unable to resolve update parameter in %s:%s ", clusterName, err.Error())
	}

	var appObj = v1beta1.Application{}
	if err := cli.Get(context.Background(), client.ObjectKey{Namespace: DefaultAppNamespace, Name: appName}, &appObj); err != nil { // application crd info
		return err
	}

	for i, c := range appObj.Status.Services {
		comp := model.ComponentType{
			Name:      c.Name,
			Namespace: DefaultAppNamespace,
			Workload:  c.WorkloadDefinition.Kind,
			Type:      appObj.Spec.Components[i].Type,
			Health:    c.Healthy,
			Phase:     string(appObj.Status.Phase),
		}
		app.Components = append(app.Components, &comp)
	}

	el := v1.EventList{}
	fieldStr := fmt.Sprintf("involvedObject.kind=Application,involvedObject.name=%s,,involvedObject.namespace=%s", appName, app.Namespace)
	if err := cli.List(context.Background(), &el, &client.ListOptions{
		Namespace: DefaultAppNamespace,
		Raw:       &metav1.ListOptions{FieldSelector: fieldStr},
	}); err != nil {
		return err
	}
	// sort event
	sort.Sort(event.SortableEvents(el.Items))
	for _, e := range el.Items {
		var age string
		if e.Count > 1 {
			age = fmt.Sprintf("%s (x%d over %s)", translateTimestampSince(e.LastTimestamp), e.Count, translateTimestampSince(e.FirstTimestamp))
		} else {
			age = translateTimestampSince(e.FirstTimestamp)
			if e.FirstTimestamp.IsZero() {
				age = translateMicroTimestampSince(e.EventTime)
			}
		}
		app.Events = append(app.Events, &model.AppEventType{
			Type:    e.Type,
			Age:     age,
			Reason:  e.Reason,
			Message: e.Message,
		})
	}

	return c.JSON(http.StatusOK, model.ApplicationResponse{
		Application: &app,
	})
}

// AddApplications for add applications to cluster
func (s *ApplicationService) AddApplications(c echo.Context) error {
	clusterName := c.Param("cluster")
	app := new(model.Application)
	if err := c.Bind(app); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	app.ClusterName = clusterName

	isAppExist, err := s.appStore.IsApplicationExist(app.Name)
	if err != nil {
		return err
	}

	if isAppExist {
		return fmt.Errorf("application %s has existed", app.Name)
	}

	cluster, err := s.clusterStore.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	expectApp, err := runtime.ParseCoreApplication(app)
	if err != nil {
		return err
	}

	if err := cli.Create(context.Background(), &expectApp); err != nil {
		return err
	}

	if err := s.appStore.AddApplication(app); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, model.ApplicationResponse{
		Application: app,
	})
}

// AddApplicationYaml for add applications with yaml to cluster
func (s *ApplicationService) AddApplicationYaml(c echo.Context) error {
	clusterName := c.Param("cluster")
	appYaml := new(model.AppYaml)
	if err := c.Bind(appYaml); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	cluster, err := s.clusterStore.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	decoder := yamlutil.NewYAMLOrJSONDecoder(bytes.NewReader([]byte(appYaml.Yaml)), 100)

	var appObj v1beta1.Application
	if err = decoder.Decode(&appObj); err != nil {
		return err
	}
	if appObj.Namespace == "" {
		appObj.Namespace = DefaultAppNamespace
	}

	if err := cli.Create(context.Background(), &appObj); err != nil {
		return err
	}

	app, err := runtime.ParseApplicationYaml(&appObj)
	if err != nil {
		return err
	}

	if err := s.appStore.AddApplication(app); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, model.ApplicationResponse{
		Application: app,
	})
}

// UpdateApplications for update application
func (s *ApplicationService) UpdateApplications(c echo.Context) error {
	clusterName := c.Param("cluster")
	app := new(model.Application)
	if err := c.Bind(app); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	app.ClusterName = clusterName

	isAppExist, err := s.appStore.IsApplicationExist(app.Name)
	if err != nil {
		return err
	}

	if !isAppExist {
		return fmt.Errorf("application %s not existed", app.Name)
	}

	cluster, err := s.clusterStore.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	expectApp, err := runtime.ParseCoreApplication(app)
	if err != nil {
		return err
	}

	expectAppObj, err := k8sruntime.DefaultUnstructuredConverter.ToUnstructured(&expectApp)
	if err != nil {
		return err
	}

	expectAppUnStruct := &unstructured.Unstructured{Object: expectAppObj}
	expectAppUnStruct.SetGroupVersionKind(v1beta1.ApplicationKindVersionKind)

	applicator := apply.NewAPIApplicator(cli)
	if err := applicator.Apply(context.Background(), expectAppUnStruct); err != nil {
		return err
	}

	if err := s.appStore.PutApplication(app); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, model.ApplicationResponse{
		Application: app,
	})
}

// RemoveApplications for remove application from cluster
func (s *ApplicationService) RemoveApplications(c echo.Context) error {
	appName := c.Param("application")
	clusterName := c.Param("cluster")

	app, err := s.appStore.GetApplications(appName)
	if err != nil {
		return err
	}

	cluster, err := s.clusterStore.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	application := &model.Application{Name: appName, Namespace: app.Namespace}
	expectApp, err := runtime.ParseCoreApplication(application)
	if err != nil {
		return err
	}

	if err := cli.Delete(context.Background(), &expectApp); err != nil {
		return err
	}

	if err := s.appStore.DelApplication(appName); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, model.ApplicationResponse{
		Application: &model.Application{Name: appName},
	})
}

func translateTimestampSince(timestamp metav1.Time) string {
	if timestamp.IsZero() {
		return "<unknown>"
	}

	return duration.HumanDuration(time.Since(timestamp.Time))
}

func translateMicroTimestampSince(timestamp metav1.MicroTime) string {
	if timestamp.IsZero() {
		return "<unknown>"
	}

	return duration.HumanDuration(time.Since(timestamp.Time))
}
