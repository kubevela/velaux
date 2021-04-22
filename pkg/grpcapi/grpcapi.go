package grpcapi

import (
	"context"
	"fmt"
	"net"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/grpcapi/services"
	"github.com/oam-dev/velacp/pkg/proto/appservice"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
	"github.com/oam-dev/velacp/pkg/proto/envservice"
)

type Config struct {
	GrpcPort int
	APIPort  int
	UIPort   int
	Logger   *zap.Logger
}

type GrpcServer interface {
	Run(context.Context) error
}

type grpcServer struct {
	ds                 datastore.DataStore
	server             *grpc.Server
	grpcServerEndpoint string
	Config
}

func New(d datastore.DataStore, cfg Config) GrpcServer {
	s := &grpcServer{
		ds:     d,
		Config: cfg,
	}

	var opts []grpc.ServerOption
	s.server = grpc.NewServer(opts...)
	s.grpcServerEndpoint = fmt.Sprintf(":%d", s.GrpcPort)
	return s
}

func (s *grpcServer) Run(ctx context.Context) error {
	s.registerServices()

	go s.serveStatic(ctx)

	go s.startAPI(ctx)

	return s.startGRPC(ctx)
}

func (s *grpcServer) registerServices() {
	catalogservice.RegisterCatalogServiceServer(s.server, services.NewCatalogService(datastore.NewCatalogStore(s.ds), s.Logger))
	clusterservice.RegisterClusterServiceServer(s.server, services.NewClusterService(datastore.NewClusterStore(s.ds), s.Logger))
	envservice.RegisterEnvServiceServer(s.server, services.NewEnvService(datastore.NewEnvStore(s.ds), s.Logger))
	appservice.RegisterApplicationServiceServer(s.server, services.NewAppService(datastore.NewApplicationStore(s.ds), s.Logger))
}

func (s *grpcServer) startAPI(ctx context.Context) {
	// Register gRPC server endpoint
	// Note: Make sure the gRPC server is running properly and accessible
	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithInsecure()}
	err := catalogservice.RegisterCatalogServiceHandlerFromEndpoint(ctx, mux, s.grpcServerEndpoint, opts)
	if err != nil {
		panic(err)
	}

	// Start HTTP server (and proxy calls to gRPC server endpoint)
	addr := fmt.Sprintf(":%d", s.APIPort)
	s.Logger.Info("APIs are being served on", zap.Int("port", s.APIPort))
	http.ListenAndServe(addr, mux)
}

func (s *grpcServer) startGRPC(ctx context.Context) error {
	l, err := net.Listen("tcp", s.grpcServerEndpoint)
	if err != nil {
		return errors.Wrap(err, "failed to listen")
	}
	s.Logger.Info("GRPC is being served", zap.Int("port", s.GrpcPort))
	err = s.server.Serve(l)
	if err != nil && err != grpc.ErrServerStopped {
		return errors.Wrap(err, "failed to serve")
	}
	return nil
}

func (s *grpcServer) serveStatic(ctx context.Context) {
	fs := http.FileServer(http.Dir("./ui/dist/"))
	http.Handle("/", fs)

	s.Logger.Info("Static files are running on", zap.Int("port", s.UIPort))
	http.ListenAndServe(fmt.Sprintf(":%d", s.UIPort), nil)
}
