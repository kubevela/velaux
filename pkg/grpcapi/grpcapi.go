package grpcapi

import (
	"context"

	"google.golang.org/grpc"

	"github.com/oam-dev/velacp/pkg/datastore"
)

type GrpcServer interface {
	Run(context.Context) error
}

type grpcServer struct {
	store  datastore.DataStore
	server *grpc.Server
}


func New(d datastore.DataStore) GrpcServer {
	s := &grpcServer{
		store: d,
	}
	return s
}


func (s *grpcServer) Run(context.Context) error {
	var opts []grpc.ServerOption
	s.server = grpc.NewServer(opts...)
	return nil
}