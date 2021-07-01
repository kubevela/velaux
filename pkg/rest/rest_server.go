package rest

import (
	"context"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/log"
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
	ds     datastore.DataStore
	server *echo.Echo
	Config
}

func New(d datastore.DataStore, cfg Config) RestServer {
	s := &restServer{
		ds:     d,
		server: newEchoInstance(),
		Config: cfg,
	}

	return s
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
	// All react routes need to be setup here. Otherwise the server returns 404 not found.
	rewrites := map[string]string{}
	s.server.Use(middleware.Static("ui/dist"))
	for _, route := range frontendRoutes {
		rewrites[route] = "/"
	}
	s.server.Pre(middleware.Rewrite(rewrites))

	capabilityStore := storeadapter.NewCapabilityStore(s.ds)
	capabilityService := services.NewCapabilityService(capabilityStore)
	s.server.GET("/api/capabilities", capabilityService.ListCapabilities)
	s.server.GET("/api/capabilities/:capabilityName", capabilityService.GetCapability)
	s.server.POST("/api/capabilities/:capabilityName/install", capabilityService.InstallCapability)

	catalogStore := storeadapter.NewCatalogStore(s.ds)
	catalogService := services.NewCatalogService(catalogStore, capabilityStore)
	s.server.GET("/api/catalogs", catalogService.ListCatalogs)
	s.server.POST("/api/catalogs", catalogService.AddCatalog)
	s.server.PUT("/api/catalogs", catalogService.UpdateCatalog)
	s.server.GET("/api/catalogs/:catalogName", catalogService.GetCatalog)
	s.server.DELETE("/api/catalogs/:catalogName", catalogService.DelCatalog)
	s.server.GET("/api/catalogs/:catalogName/capabilities", catalogService.GetCapabilities)
	s.server.POST("/api/catalogs/:catalogName/sync", catalogService.SyncCatalog)

	clusterStore := storeadapter.NewClusterStore(s.ds)
	clusterService := services.NewClusterService(clusterStore)
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
	appStore := storeadapter.NewApplicationStore(s.ds)
	applicationService := services.NewApplicationService(appStore, clusterStore)
	s.server.GET("/api/clusters/:cluster/applications", applicationService.GetApplications)
	s.server.GET("/api/clusters/:cluster/applications/:application", applicationService.GetApplicationDetail)
	s.server.POST("/api/clusters/:cluster/applications", applicationService.AddApplications)
	s.server.POST("/api/clusters/:cluster/appYaml", applicationService.AddApplicationYaml)
	s.server.PUT("/api/clusters/:cluster/applications", applicationService.UpdateApplications)
	s.server.DELETE("/api/clusters/:cluster/applications/:application", applicationService.RemoveApplications)

	velaInstallService := services.NewVelaInstallService(clusterStore)
	s.server.GET("/api/clusters/:cluster/installvela", velaInstallService.InstallVela)
	s.server.GET("/api/clusters/:cluster/isvelainstalled", velaInstallService.IsVelaInstalled)

	// show Definition schema
	schemaService := services.NewSchemaService(clusterStore)
	s.server.GET("/api/clusters/:cluster/schema", schemaService.GetWorkloadSchema)
}

func (s *restServer) startHTTP(ctx context.Context) error {
	// Start HTTP server
	log.Logger.Infof("HTTP APIs are being served on port: %d", s.Config.Port)
	addr := fmt.Sprintf(":%d", s.Config.Port)
	return s.server.Start(addr)
}
