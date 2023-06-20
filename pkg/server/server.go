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

package server

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"cuelang.org/go/pkg/strings"
	restfulSpec "github.com/emicklei/go-restful-openapi/v2"
	"github.com/emicklei/go-restful/v3"
	"github.com/go-openapi/spec"
	"github.com/julienschmidt/httprouter"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/leaderelection"
	"k8s.io/client-go/tools/leaderelection/resourcelock"
	"k8s.io/klog/v2"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/kubevela/apis/types"
	pkgaddon "github.com/oam-dev/kubevela/pkg/addon"
	pkgconfig "github.com/oam-dev/kubevela/pkg/config"

	pkgUtils "github.com/oam-dev/kubevela/pkg/utils"
	"github.com/oam-dev/kubevela/pkg/utils/apply"

	"github.com/kubevela/velaux/pkg/features"
	"github.com/kubevela/velaux/pkg/plugin/proxy"
	"github.com/kubevela/velaux/pkg/plugin/router"
	plugintypes "github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/config"
	"github.com/kubevela/velaux/pkg/server/domain/service"
	"github.com/kubevela/velaux/pkg/server/event"
	"github.com/kubevela/velaux/pkg/server/infrastructure/clients"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/mongodb"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore/mysql"
	"github.com/kubevela/velaux/pkg/server/interfaces/api"
	"github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
	"github.com/kubevela/velaux/pkg/server/utils/container"
	"github.com/kubevela/velaux/pkg/server/utils/filters"
)

const (
	// SwaggerConfigRoutePath the path to request the swagger config
	SwaggerConfigRoutePath = "/debug/apidocs.json"

	// BuildPublicRoutePath the route prefix to request the build static files.
	BuildPublicRoutePath = "/public/build"

	// PluginPublicRoutePath the route prefix to request the plugin static files.
	PluginPublicRoutePath = "/public/plugins/"

	// PluginProxyRoutePath the route prefix to request the plugin backend server.
	PluginProxyRoutePath = plugintypes.PluginProxyRoutePath

	// DexRoutePath the route prefix to request the dex service
	DexRoutePath = "/dex"

	// BuildPublicPath the route prefix to request the build static files.
	BuildPublicPath = "public/build"
)

// APIServer interface for call api server
type APIServer interface {
	Run(context.Context, chan error) error
	BuildRestfulConfig() (*restfulSpec.Config, error)
}

// restServer rest server
type restServer struct {
	webContainer  *restful.Container
	beanContainer *container.Container
	cfg           config.Config
	dataStore     datastore.DataStore
	PluginService service.PluginService `inject:""`
	KubeClient    client.Client         `inject:"kubeClient"`
	KubeConfig    *rest.Config          `inject:"kubeConfig"`
	RBACService   service.RBACService   `inject:""`
	UserService   service.UserService   `inject:""`
}

// New create api server with config data
func New(cfg config.Config) (a APIServer) {
	s := &restServer{
		webContainer:  restful.NewContainer(),
		beanContainer: container.NewContainer(),
		cfg:           cfg,
	}
	return s
}

func (s *restServer) buildIoCContainer() error {
	// infrastructure
	if err := s.beanContainer.ProvideWithName("RestServer", s); err != nil {
		return fmt.Errorf("fail to provides the RestServer bean to the container: %w", err)
	}
	err := clients.SetKubeConfig(s.cfg)
	if err != nil {
		return err
	}
	kubeConfig, err := clients.GetKubeConfig()
	if err != nil {
		return err
	}
	kubeClient, err := clients.GetKubeClient()
	if err != nil {
		return err
	}
	authClient := utils.NewAuthClient(kubeClient)

	var ds datastore.DataStore
	switch s.cfg.Datastore.Type {
	case "mongodb":
		ds, err = mongodb.New(context.Background(), s.cfg.Datastore)
		if err != nil {
			return fmt.Errorf("create mongodb datastore instance failure %w", err)
		}
	case "kubeapi":
		ds, err = kubeapi.New(context.Background(), s.cfg.Datastore, kubeClient)
		if err != nil {
			return fmt.Errorf("create kubeapi datastore instance failure %w", err)
		}
	case "mysql":
		ds, err = mysql.New(context.Background(), s.cfg.Datastore)
		if err != nil {
			return fmt.Errorf("create mysql datastore instance failure %w", err)
		}
	default:
		return fmt.Errorf("not support datastore type %s", s.cfg.Datastore.Type)
	}
	s.dataStore = ds
	if err := s.beanContainer.ProvideWithName("datastore", s.dataStore); err != nil {
		return fmt.Errorf("fail to provides the datastore bean to the container: %w", err)
	}

	if err := s.beanContainer.ProvideWithName("kubeClient", authClient); err != nil {
		return fmt.Errorf("fail to provides the kubeClient bean to the container: %w", err)
	}
	if err := s.beanContainer.ProvideWithName("kubeConfig", kubeConfig); err != nil {
		return fmt.Errorf("fail to provides the kubeConfig bean to the container: %w", err)
	}
	if err := s.beanContainer.ProvideWithName("apply", apply.NewAPIApplicator(authClient)); err != nil {
		return fmt.Errorf("fail to provides the apply bean to the container: %w", err)
	}

	factory := pkgconfig.NewConfigFactory(authClient)
	if err := s.beanContainer.ProvideWithName("configFactory", factory); err != nil {
		return fmt.Errorf("fail to provides the config factory bean to the container: %w", err)
	}

	addonStore := pkgaddon.NewRegistryDataStore(authClient)
	if err := s.beanContainer.ProvideWithName("registryDatastore", addonStore); err != nil {
		return fmt.Errorf("fail to provides the registry datastore bean to the container: %w", err)
	}
	// domain
	if err := s.beanContainer.Provides(service.InitServiceBean(s.cfg)...); err != nil {
		return fmt.Errorf("fail to provides the service bean to the container: %w", err)
	}

	// interfaces
	if err := s.beanContainer.Provides(api.InitAPIBean()...); err != nil {
		return fmt.Errorf("fail to provides the api bean to the container: %w", err)
	}

	// event
	if err := s.beanContainer.Provides(event.InitEvent(s.cfg)...); err != nil {
		return fmt.Errorf("fail to provides the event bean to the container: %w", err)
	}

	if err := s.beanContainer.Populate(); err != nil {
		return fmt.Errorf("fail to populate the bean container: %w", err)
	}
	return nil
}

func (s *restServer) Run(ctx context.Context, errChan chan error) error {

	for feature := range features.APIServerMutableFeatureGate.GetAll() {
		if features.APIServerFeatureGate.Enabled(feature) {
			klog.Infof("The %s feature enabled", feature)
		}
	}

	// build the Ioc Container
	if err := s.buildIoCContainer(); err != nil {
		return err
	}

	// init database
	if err := service.InitData(ctx); err != nil {
		return fmt.Errorf("fail to init database %w", err)
	}

	s.RegisterAPIRoute()

	l, err := s.setupLeaderElection(errChan)
	if err != nil {
		return err
	}

	go func() {
		leaderelection.RunOrDie(ctx, *l)
	}()
	return s.startHTTP(ctx)
}

func (s *restServer) setupLeaderElection(errChan chan error) (*leaderelection.LeaderElectionConfig, error) {
	restCfg := ctrl.GetConfigOrDie()

	rl, err := resourcelock.NewFromKubeconfig(resourcelock.LeasesResourceLock, types.DefaultKubeVelaNS, s.cfg.LeaderConfig.LockName, resourcelock.ResourceLockConfig{
		Identity: s.cfg.LeaderConfig.ID,
	}, restCfg, time.Second*10)
	if err != nil {
		klog.ErrorS(err, "Unable to setup the resource lock")
		return nil, err
	}

	return &leaderelection.LeaderElectionConfig{
		Lock:          rl,
		LeaseDuration: time.Second * 15,
		RenewDeadline: time.Second * 10,
		RetryPeriod:   time.Second * 2,
		Callbacks: leaderelection.LeaderCallbacks{
			OnStartedLeading: func(ctx context.Context) {
				go event.StartEventWorker(ctx, errChan)
			},
			OnStoppedLeading: func() {
				errChan <- fmt.Errorf("leader lost %s", s.cfg.LeaderConfig.ID)
			},
			OnNewLeader: func(identity string) {
				if identity == s.cfg.LeaderConfig.ID {
					return
				}
				klog.Infof("new leader elected: %s", identity)
			},
		},
		ReleaseOnCancel: true,
	}, nil
}

// BuildRestfulConfig build the restful config
// This function will build the smallest set of beans
func (s *restServer) BuildRestfulConfig() (*restfulSpec.Config, error) {
	if err := s.buildIoCContainer(); err != nil {
		return nil, err
	}
	config := s.RegisterAPIRoute()
	return &config, nil
}

// RegisterAPIRoute register the API route
func (s *restServer) RegisterAPIRoute() restfulSpec.Config {
	/* **************************************************************  */
	/* *************       Open API Route Group     *****************  */
	/* **************************************************************  */
	// Add container filter to enable CORS
	cors := restful.CrossOriginResourceSharing{
		ExposeHeaders:  []string{},
		AllowedHeaders: []string{"Content-Type", "Accept", "Authorization", "RefreshToken"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		CookiesAllowed: true,
		Container:      s.webContainer}
	s.webContainer.Filter(cors.Filter)

	// Add container filter to respond to OPTIONS
	s.webContainer.Filter(s.webContainer.OPTIONSFilter)
	s.webContainer.Filter(s.OPTIONSFilter)

	// Add request log
	s.webContainer.Filter(s.requestLog)

	// Register all custom api
	for _, handler := range api.GetRegisteredAPI() {
		s.webContainer.Add(handler.GetWebServiceRoute())
	}

	config := restfulSpec.Config{
		WebServices:                   s.webContainer.RegisteredWebServices(), // you control what services are visible
		APIPath:                       SwaggerConfigRoutePath,
		PostBuildSwaggerObjectHandler: enrichSwaggerObject}
	s.webContainer.Add(restfulSpec.NewOpenAPIService(config))
	return config
}

func (s *restServer) requestLog(req *restful.Request, resp *restful.Response, chain *restful.FilterChain) {
	if req.HeaderParameter("Upgrade") == "websocket" && req.HeaderParameter("Connection") == "Upgrade" {
		chain.ProcessFilter(req, resp)
		return
	}
	start := time.Now()
	c := utils.NewResponseCapture(resp.ResponseWriter)
	resp.ResponseWriter = c
	chain.ProcessFilter(req, resp)
	takeTime := time.Since(start)
	klog.InfoS("request log",
		"clientIP", pkgUtils.Sanitize(utils.ClientIP(req.Request)),
		"path", pkgUtils.Sanitize(req.Request.URL.Path),
		"method", req.Request.Method,
		"status", c.StatusCode(),
		"time", takeTime.String(),
		"responseSize", len(c.Bytes()),
	)
}

func (s *restServer) OPTIONSFilter(req *restful.Request, resp *restful.Response, chain *restful.FilterChain) {
	if req.Request.Method != "OPTIONS" {
		chain.ProcessFilter(req, resp)
		return
	}
	resp.AddHeader(restful.HEADER_AccessControlAllowCredentials, "true")
}

func enrichSwaggerObject(swo *spec.Swagger) {
	swo.Info = &spec.Info{
		InfoProps: spec.InfoProps{
			Title:       "Kubevela api doc",
			Description: "Kubevela api doc",
			Contact: &spec.ContactInfo{
				ContactInfoProps: spec.ContactInfoProps{
					Name:  "kubevela",
					Email: "feedback@mail.kubevela.io",
					URL:   "https://kubevela.io/",
				},
			},
			License: &spec.License{
				LicenseProps: spec.LicenseProps{
					Name: "Apache License 2.0",
					URL:  "https://github.com/oam-dev/kubevela/blob/master/LICENSE",
				},
			},
			Version: "v1beta1",
		},
	}
}

func (s *restServer) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	var staticFilters []utils.FilterFunction
	if features.APIServerFeatureGate.Enabled(features.APIServerEnableCacheJSFile) {
		staticFilters = append(staticFilters, filters.JSCache)
	}
	staticFilters = append(staticFilters, filters.Gzip)
	switch {
	case strings.HasPrefix(req.URL.Path, SwaggerConfigRoutePath):
		s.webContainer.ServeHTTP(res, req)
		return
	case strings.HasPrefix(req.URL.Path, BuildPublicRoutePath):
		utils.NewFilterChain(func(req *http.Request, res http.ResponseWriter) {
			s.staticFiles(res, req, "./")
		}, staticFilters...).ProcessFilter(req, res)
		return
	case strings.HasPrefix(req.URL.Path, PluginPublicRoutePath):
		utils.NewFilterChain(s.getPluginAssets, staticFilters...).ProcessFilter(req, res)
		return
	case strings.HasPrefix(req.URL.Path, PluginProxyRoutePath):
		utils.NewFilterChain(s.proxyPluginBackend, api.AuthTokenCheck, api.AuthUserCheck(s.UserService)).ProcessFilter(req, res)
		return
	case strings.HasPrefix(req.URL.Path, DexRoutePath):
		s.proxyDexService(res, req)
		return
	default:
		for _, pre := range api.GetAPIPrefix() {
			if strings.HasPrefix(req.URL.Path, pre) {
				s.webContainer.ServeHTTP(res, req)
				return
			}
		}
		// Rewrite to index.html, which means this route is handled by frontend.
		req.URL.Path = "/"
		utils.NewFilterChain(func(req *http.Request, res http.ResponseWriter) {
			s.staticFiles(res, req, BuildPublicPath)
		}, staticFilters...).ProcessFilter(req, res)
	}
}

func (s *restServer) staticFiles(res http.ResponseWriter, req *http.Request, root string) {
	http.FileServer(http.Dir(root)).ServeHTTP(res, req)
}

// route: /public/plugins/{pluginId}/*
func (s *restServer) getPluginAssets(req *http.Request, res http.ResponseWriter) {
	// Check the plugin
	pathInfo := strings.SplitN(strings.Replace(req.URL.Path, PluginPublicRoutePath, "", 1), "/", 2)
	if len(pathInfo) < 2 {
		bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		return
	}
	pluginID := pathInfo[0]
	plugin, err := s.PluginService.GetPlugin(req.Context(), pluginID)
	if err != nil {
		bcode.ReturnHTTPError(req, res, err)
		return
	}
	// Generate the static file path
	path, err := utils.CleanRelativePath(pathInfo[1])
	if err != nil {
		bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		return
	}
	req.URL.Path = path
	s.staticFiles(res, req, plugin.PluginDir)
}

// route: /proxy/plugins/{pluginId}/*
func (s *restServer) proxyPluginBackend(req *http.Request, res http.ResponseWriter) {
	// Check the plugin
	pathInfo := strings.SplitN(strings.Replace(req.URL.Path, PluginProxyRoutePath, "", 1), "/", 2)
	if len(pathInfo) < 2 {
		bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		return
	}
	pluginID := pathInfo[0]
	plugin, err := s.PluginService.GetPlugin(req.Context(), pluginID)
	if err != nil {
		bcode.ReturnHTTPError(req, res, err)
		return
	}
	if !plugin.Backend {
		bcode.ReturnHTTPError(req, res, bcode.ErrIsNotBackendPlugin)
		return
	}
	if !plugin.Proxy {
		bcode.ReturnHTTPError(req, res, bcode.ErrIsNotProxyBackendPlugin)
		return
	}
	setting, err := s.PluginService.GetPluginSetting(req.Context(), pluginID)
	if err != nil {
		bcode.ReturnHTTPError(req, res, err)
		return
	}
	if !setting.Enabled {
		bcode.ReturnHTTPError(req, res, bcode.ErrPluginNotEnabled)
		return
	}
	// Register the plugin route
	router.GetPluginHandler(plugin, s.pluginBackendProxyHandler).ServeHTTP(res, req)
}

func (s *restServer) pluginBackendProxyHandler(w http.ResponseWriter, r *http.Request, p httprouter.Params, plugin *plugintypes.Plugin, route *plugintypes.Route) {
	// Check permissions
	if !s.RBACService.CheckPluginRequestPerm(p, route)(r, w) {
		return
	}
	pro, err := proxy.NewBackendPluginProxy(plugin, s.KubeClient, s.KubeConfig)
	if err != nil {
		bcode.ReturnHTTPError(r, w, err)
		return
	}
	r.URL.Path = strings.Replace(r.URL.Path, "/proxy/plugins/"+plugin.PluginID(), "", 1)
	r = r.WithContext(context.WithValue(r.Context(), &proxy.RouteCtxKey, route))
	pro.Handler(r, w)
}

func (s *restServer) proxyDexService(res http.ResponseWriter, req *http.Request) {
	if s.cfg.DexServerURL == "" {
		bcode.ReturnHTTPError(req, res, bcode.ErrNotFound)
		return
	}
	u, err := url.Parse(s.cfg.DexServerURL)
	if err != nil {
		bcode.ReturnHTTPError(req, res, err)
		return
	}
	director := func(req *http.Request) {
		req.URL.Scheme = u.Scheme
		req.URL.Host = u.Host
	}
	dexProxy := &httputil.ReverseProxy{Director: director}
	dexProxy.ServeHTTP(res, req)
}

func (s *restServer) startHTTP(ctx context.Context) error {
	// Start HTTP apiserver
	klog.Infof("HTTP APIs are being served on: %s, ctx: %s", s.cfg.BindAddr, ctx)
	server := &http.Server{Addr: s.cfg.BindAddr, Handler: s, ReadHeaderTimeout: 2 * time.Second}
	return server.ListenAndServe()
}
