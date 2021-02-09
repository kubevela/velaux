package client

import (
	"context"
	"errors"

	"github.com/spf13/cobra"
	"google.golang.org/grpc"

	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
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

func (o *Options) newgrpcConn(ctx context.Context) (*grpc.ClientConn, error) {
	if err := o.Validate(); err != nil {
		return nil, err
	}
	var opts []grpc.DialOption
	opts = append(opts, grpc.WithInsecure())
	return grpc.DialContext(ctx, o.Address, opts...)
}

func (o *Options) NewCatalogClient(ctx context.Context) (catalogservice.CatalogServiceClient, *grpc.ClientConn, error) {
	conn, err := o.newgrpcConn(ctx)
	if err != nil {
		return nil, nil, err
	}
	return catalogservice.NewCatalogServiceClient(conn), conn, nil
}

func (o *Options) NewClusterClient(ctx context.Context) (clusterservice.ClusterServiceClient, *grpc.ClientConn, error) {
	conn, err := o.newgrpcConn(ctx)
	if err != nil {
		return nil, nil, err
	}
	return clusterservice.NewClusterServiceClient(conn), conn, nil
}
