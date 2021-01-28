package catalog

import (
	"context"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/client"
)

func NewCatalogCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "catalog",
		Short: "Manage catalog resources.",
	}

	o := &client.Options{}
	o.RegisterPersistentFlags(cmd)

	cmd.AddCommand(
		newListCommand(o),
	)
	return cmd

}

func newListCommand(o *client.Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list",
		Short: "Show the list of catalogs.",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, err := o.NewClient(ctx)
			if err != nil {
				return err
			}
			defer c.Close()
			return nil
		},
	}
	return cmd
}
