package client

import (
	"context"
	"errors"

	"github.com/spf13/cobra"
	"google.golang.org/grpc"

	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

type Options struct {
	Address string
}

func (o *Options) RegisterPersistentFlags(cmd *cobra.Command) {
	cmd.PersistentFlags().StringVar(&o.Address, "address", o.Address, "The address to control-plane api.")
}

func (o *Options) Validate() error {
	if o.Address == "" {
		return errors.New("address must be set")
	}
	return nil
}

func (o *Options) NewCatalogClient(ctx context.Context) (catalogservice.CatalogServiceClient, *grpc.ClientConn, error) {
	if err := o.Validate(); err != nil {
		return nil, nil, err
	}
	var opts []grpc.DialOption
	conn, err := grpc.DialContext(ctx, o.Address, opts...)
	if err != nil {
		return nil, nil, err
	}
	return catalogservice.NewCatalogServiceClient(conn), conn, nil
}
