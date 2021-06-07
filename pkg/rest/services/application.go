package services

import (
	"context"
	"fmt"
	"net/http"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/pkg/utils/apply"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	kruntime "k8s.io/apimachinery/pkg/runtime"

	"github.com/oam-dev/velacp/pkg/runtime"

	"github.com/labstack/echo/v4"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/proto/model"
)

type ApplicationService struct {
	appStore     storeadapter.ApplicationStore
	clusterStore storeadapter.ClusterStore
}

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
	appName := c.QueryParam("appName")
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
