package grpcapi

import (
	"context"
	"fmt"
	"net"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/oam-dev/velacp/pkg/datastore"
)

type Config struct {
	Port   int
	Logger *zap.Logger
}

type GrpcServer interface {
	Run(context.Context) error
}

type grpcServer struct {
	store  datastore.DataStore
	server *grpc.Server
	Config
}


func New(d datastore.DataStore, cfg Config) GrpcServer {
	s := &grpcServer{
		store: d,
		Config: cfg,
	}

	var opts []grpc.ServerOption
	s.server = grpc.NewServer(opts...)
	return s
}


func (s *grpcServer) Run(context.Context) error {
	l, err := net.Listen("tcp", fmt.Sprintf(":%d", s.Port))
	if err != nil {
		return errors.Wrap(err, "failed to listen")
	}
	s.Logger.Info("grpc server is running on", zap.Int("port", s.Port))
	err = s.server.Serve(l)
	if err != nil && err != grpc.ErrServerStopped {
		return errors.Wrap(err,"failed to serve")
	}
	return nil
}