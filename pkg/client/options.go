package client

import (
	"context"
	"errors"

	"github.com/spf13/cobra"
	"google.golang.org/grpc"

	"github.com/oam-dev/velacp/pkg/proto/appservice"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
	"github.com/oam-dev/velacp/pkg/proto/envservice"
)

type Options struct {
	Address string
}

func (o *Options) RegisterPersistentFlags(cmd *cobra.Command) {
	cmd.PersistentFlags().StringVar(&o.Address, "address", "localhost:9000", "The address to control-plane api.")
}

func (o *Options) Validate() error {
	if o.Address == "" {
		return errors.New("address must be set")
	}
	return nil
}

func (o *Options) newGrpcConn(ctx context.Context) (*grpc.ClientConn, error) {
	if err := o.Validate(); err != nil {
		return nil, err
	}
	var opts []grpc.DialOption
	opts = append(opts, grpc.WithInsecure())
	return grpc.DialContext(ctx, o.Address, opts...)
}

func (o *Options) NewCatalogClient(ctx context.Context) (catalogservice.CatalogServiceClient, *grpc.ClientConn, error) {
	conn, err := o.newGrpcConn(ctx)
	if err != nil {
		return nil, nil, err
	}
	return catalogservice.NewCatalogServiceClient(conn), conn, nil
}

func (o *Options) NewClusterClient(ctx context.Context) (clusterservice.ClusterServiceClient, *grpc.ClientConn, error) {
	conn, err := o.newGrpcConn(ctx)
	if err != nil {
		return nil, nil, err
	}
	return clusterservice.NewClusterServiceClient(conn), conn, nil
}

func (o *Options) NewEnvClient(ctx context.Context) (envservice.EnvServiceClient, *grpc.ClientConn, error) {
	conn, err := o.newGrpcConn(ctx)
	if err != nil {
		return nil, nil, err
	}
	return envservice.NewEnvServiceClient(conn), conn, nil
}

func (o *Options) NewAppClient(ctx context.Context) (appservice.ApplicationServiceClient, *grpc.ClientConn, error) {
	conn, err := o.newGrpcConn(ctx)
	if err != nil {
		return nil, nil, err
	}
	return appservice.NewApplicationServiceClient(conn), conn, nil
}
