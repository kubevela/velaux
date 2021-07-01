package services

import (
	"bytes"
	"context"
	"fmt"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/utils/apply"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	kruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/duration"
	yamlutil "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/kubectl/pkg/util/event"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sort"
	"time"

	"github.com/oam-dev/velacp/pkg/runtime"

	"github.com/labstack/echo/v4"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
)

type ApplicationService struct {
	appStore     storeadapter.ApplicationStore
	clusterStore storeadapter.ClusterStore
}

const (
	DefaultNamespace = "default"
)

func NewApplicationService(appStore storeadapter.ApplicationStore, clusterStore storeadapter.ClusterStore) *ApplicationService {
	return &ApplicationService{
		appStore:     appStore,
		clusterStore: clusterStore,
	}
}

// GetApplications for get applications from cluster
func (s *ApplicationService) GetApplications(c echo.Context) error {
	appName := c.QueryParam("appName")
	apps, err := s.appStore.ListApplications(appName)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.ApplicationListResponse{
		Applications: apps,
	})
}

func (s *ApplicationService) GetApplicationDetail(c echo.Context) error {
	appName := c.Param("application")
	clusterName := c.Param("cluster")
	app, err := s.appStore.GetApplications(appName)
	if err != nil {
		return err
	}

	app.ClusterName = clusterName
	cluster, err := s.clusterStore.GetCluster(clusterName)
	if err != nil {
		return err
	}

	cli, err := runtime.GetClient([]byte(cluster.Kubeconfig))
	if err != nil {
		return err
	}

	appObj := v1beta1.Application{}
	key := client.ObjectKey{Namespace: DefaultNamespace, Name: appName}
	if err := cli.Get(context.Background(), key, &appObj); err != nil {
		return err
	}

	for i, c := range appObj.Status.Services {
		app.Components[i].Namespace = DefaultNamespace
		app.Components[i].Workload = c.WorkloadDefinition.Kind
		app.Components[i].Health = c.Healthy
		app.Components[i].Phase = string(appObj.Status.Phase)
	}

	el := corev1.EventList{}
	fieldStr := fmt.Sprintf("involvedObject.kind=Application,involvedObject.name=%s,,involvedObject.namespace=%s", appName, app.Namespace)
	if err := cli.List(context.Background(), &el, &client.ListOptions{
		Namespace: DefaultNamespace,
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
		Application: app,
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
		appObj.Namespace = DefaultNamespace
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

	expectAppObj, err := kruntime.DefaultUnstructuredConverter.ToUnstructured(&expectApp)
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
