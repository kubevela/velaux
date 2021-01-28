package client

import (
	"context"
	"errors"

	"github.com/spf13/cobra"
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

func (o *Options) NewClient(ctx context.Context) (APIServiceClient, error) {
	if err := o.Validate(); err != nil {
		return nil, err
	}
	panic("")
}
