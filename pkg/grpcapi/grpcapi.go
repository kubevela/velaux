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
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

type Config struct {
	GrpcPort int
	HttpPort int
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

	l, err := net.Listen("tcp", s.grpcServerEndpoint)
	if err != nil {
		return errors.Wrap(err, "failed to listen")
	}
	s.Logger.Info("grpc server is running on", zap.Int("port", s.GrpcPort))
	err = s.server.Serve(l)
	if err != nil && err != grpc.ErrServerStopped {
		return errors.Wrap(err, "failed to serve")
	}
	return nil
}

func (s *grpcServer) registerServices() {
	catalogservice.RegisterCatalogServiceServer(s.server, &services.CatalogService{Store: datastore.NewCatalogStore(s.ds)})
}

func (s *grpcServer) startHTTP(ctx context.Context) {
	// Register gRPC server endpoint
	// Note: Make sure the gRPC server is running properly and accessible
	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithInsecure()}
	err := catalogservice.RegisterCatalogServiceHandlerFromEndpoint(ctx, mux, s.grpcServerEndpoint, opts)
	if err != nil {
		panic(err)
	}

	// Start HTTP server (and proxy calls to gRPC server endpoint)
	http.ListenAndServe(fmt.Sprintf(":%d", s.HttpPort), mux)
}
