package rest

import (
	"context"
	"fmt"
	"net/http"

	echo "github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	v1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/log"
	initClient "github.com/oam-dev/velacp/pkg/rest/client"
	"github.com/oam-dev/velacp/pkg/rest/services"
)

var _ RestServer = &restServer{}

var frontendRoutes = []string{
	"/",
	"^/clusters",
	"^/clusters/*",
	"^/applicatons",
}

type Config struct {
	Port int
}

type RestServer interface {
	Run(context.Context) error
}

type restServer struct {
	ds        datastore.DataStore
	server    *echo.Echo
	k8sClient client.Client
	cfg       Config
}

const (
	DefaultUINamespace = "velaui"
)

func New(d datastore.DataStore, cfg Config) (RestServer, error) {
	client, err := initClient.NewK8sClient()
	if err != nil {
		return nil, fmt.Errorf("create client for clusterService failed")
	}
	s := &restServer{
		ds:        d,
		server:    newEchoInstance(),
		k8sClient: client,
		cfg:       cfg,
	}

	return s, nil
}

func newEchoInstance() *echo.Echo {
	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Gzip())
	e.Use(middleware.Logger())
	e.Pre(middleware.RemoveTrailingSlash())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	return e
}

func (s *restServer) Run(ctx context.Context) error {
	s.registerServices()
	return s.startHTTP(ctx)
}

func (s *restServer) registerServices() {
	// All react routes need to be setup here. Otherwise the server returns 404 .
	rewrites := map[string]string{}
	s.server.Use(middleware.Static("ui/dist"))
	for _, route := range frontendRoutes {
		rewrites[route] = "/"
	}
	s.server.Pre(middleware.Rewrite(rewrites))
	// create specific namespace for better resource management

	var ns v1.Namespace
	if err := s.k8sClient.Get(context.Background(), types.NamespacedName{Name: DefaultUINamespace}, &ns); err != nil && apierrors.IsNotFound(err) {
		// not found
		ns = v1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: DefaultUINamespace,
			},
		}
		err := s.k8sClient.Create(context.Background(), &ns)
		if err != nil {
			log.Logger.Errorf("create namespace for velaui system failed %s ", err.Error())
		}
	}

	capabilityService, err := services.NewCapabilityService()
	if err != nil {
		log.Logger.Errorf(err.Error())
	}
	s.server.GET("/api/capabilities", capabilityService.ListCapabilities)
	s.server.GET("/api/capabilities/:capabilityName", capabilityService.GetCapability)
	s.server.POST("/api/capabilities/:capabilityName/install", capabilityService.InstallCapability)

	catalogService, err := services.NewCatalogService()
	if err != nil {
		log.Logger.Errorf(err.Error())
	}
	s.server.GET("/api/catalogs", catalogService.ListCatalogs)
	s.server.POST("/api/catalogs", catalogService.AddCatalog)
	s.server.PUT("/api/catalogs", catalogService.UpdateCatalog)
	s.server.GET("/api/catalogs/:catalogName", catalogService.GetCatalog)
	s.server.DELETE("/api/catalogs/:catalogName", catalogService.DelCatalog)

	// cluster
	clusterService, err := services.NewClusterService()
	if err != nil {
		log.Logger.Errorf(err.Error())
	}
	s.server.GET("/api/cluster", clusterService.GetCluster)
	s.server.GET("/api/clusters", clusterService.ListClusters)
	s.server.GET("/api/clusternames", clusterService.GetClusterNames)
	s.server.POST("/api/clusters", clusterService.AddCluster)
	s.server.PUT("/api/clusters", clusterService.UpdateCluster)
	s.server.DELETE("/api/clusters/:clusterName", clusterService.DelCluster)

	// definitions
	s.server.GET("/api/clusters/:clusterName/componentdefinitions", clusterService.ListComponentDef)
	s.server.GET("/api/clusters/:clusterName/traitdefinitions", clusterService.ListTraitDef)

	// application
	applicationService, err := services.NewApplicationService()
	if err != nil {
		log.Logger.Errorf("create application service failed! %s: ", err.Error())
	}
	s.server.GET("/api/clusters/:cluster/applications", applicationService.GetApplications)
	s.server.GET("/api/clusters/:cluster/applications/:application", applicationService.GetApplicationDetail)
	s.server.POST("/api/clusters/:cluster/applications", applicationService.AddApplications)
	s.server.POST("/api/clusters/:cluster/appYaml", applicationService.AddApplicationYaml)
	s.server.PUT("/api/clusters/:cluster/applications", applicationService.UpdateApplications)
	s.server.DELETE("/api/clusters/:cluster/applications/:application", applicationService.RemoveApplications)

	velaInstallService, err := services.NewVelaInstallService()
	if err != nil {
		log.Logger.Errorf(err.Error())
	}
	s.server.GET("/api/clusters/:cluster/installvela", velaInstallService.InstallVela)
	s.server.GET("/api/clusters/:cluster/isvelainstalled", velaInstallService.IsVelaInstalled)

	// show Definition schema
	schemaService, err := services.NewSchemaService()
	if err != nil {
		log.Logger.Errorf(err.Error())
	}
	s.server.GET("/api/clusters/:cluster/schema", schemaService.GetWorkloadSchema)
}

func (s *restServer) startHTTP(ctx context.Context) error {
	// Start HTTP server
	log.Logger.Infof("HTTP APIs are being served on port: %d", s.cfg.Port)
	addr := fmt.Sprintf(":%d", s.cfg.Port)
	return s.server.Start(addr)
}
