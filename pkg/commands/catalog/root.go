package catalog

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/client"
	"github.com/oam-dev/velacp/pkg/proto/catalogservice"
)

func NewCatalogCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "catalog",
		Short: "Manage catalog resources.",
	}

	o := &client.Options{}
	o.RegisterPersistentFlags(cmd)

	cmd.AddCommand(
		newAddCommand(o),
		newListCommand(o),
	)
	return cmd

}

func newAddCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.AddCatalogRequest{}

	cmd := &cobra.Command{
		Use:   "add",
		Short: "Add a catalog or update existing one",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			_, err = c.AddCatalog(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	cmd.Flags().StringVar(&req.Name, "name", req.Name, "The catalog name.")
	return cmd
}

func newListCommand(o *client.Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list",
		Short: "Show the list of catalogs.",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			req := &catalogservice.ListCatalogsRequest{}
			resp, err := c.ListCatalogs(ctx, req)
			if err != nil {
				return err
			}

			b, err := json.MarshalIndent(resp, "", "  ")
			if err != nil {
				return err
			}
			fmt.Println(string(b))

			return nil
		},
	}
	return cmd
}
