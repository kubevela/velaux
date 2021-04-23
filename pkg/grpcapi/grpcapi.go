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

	"github.com/oam-dev/velacp/pkg/proto/envservice"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/grpcapi/services"
	"github.com/oam-dev/velacp/pkg/proto/appservice"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
)

type Config struct {
	GrpcPort int
	HTTPPort int
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

	go s.startHTTP(ctx)

	return s.startGRPC(ctx)
}

func (s *grpcServer) registerServices() {
	catalogservice.RegisterCatalogServiceServer(s.server, services.NewCatalogService(storeadapter.NewCatalogStore(s.ds), s.Logger))
	clusterservice.RegisterClusterServiceServer(s.server, services.NewClusterService(storeadapter.NewClusterStore(s.ds), s.Logger))
	envservice.RegisterEnvServiceServer(s.server, services.NewEnvService(datastore.NewEnvStore(s.ds), s.Logger))
	appservice.RegisterApplicationServiceServer(s.server, services.NewAppService(storeadapter.NewApplicationStore(s.ds), s.Logger))
}

func (s *grpcServer) startHTTP(ctx context.Context) {
	mux := http.NewServeMux()

	// Register gRPC server endpoint which will proxy calls to gRPC server endpoint
	grpcMux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithInsecure()}
	err := catalogservice.RegisterCatalogServiceHandlerFromEndpoint(ctx, grpcMux, s.grpcServerEndpoint, opts)
	if err != nil {
		panic(err)
	}

	mux.Handle("/api/", grpcMux)

	// register static files endpoint
	fs := http.FileServer(http.Dir("./ui/dist/"))
	mux.Handle("/", fs)

	// Start HTTP server
	addr := fmt.Sprintf(":%d", s.HTTPPort)
	s.Logger.Info("HTTP APIs are being served on", zap.Int("port", s.HTTPPort))

	http.ListenAndServe(addr, mux)
}

func (s *grpcServer) startGRPC(ctx context.Context) error {
	l, err := net.Listen("tcp", s.grpcServerEndpoint)
	if err != nil {
		return errors.Wrap(err, "failed to listen")
	}
	s.Logger.Info("GRPC APIs are being served", zap.Int("port", s.GrpcPort))
	err = s.server.Serve(l)
	if err != nil && err != grpc.ErrServerStopped {
		return errors.Wrap(err, "failed to serve")
	}
	return nil
}
