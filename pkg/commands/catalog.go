package commands

import (
	"context"
	"errors"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/client"
	"github.com/oam-dev/velacp/pkg/datastore/model"
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
		newCatalogPutCommand(o),
		newCatalogListCommand(o),
		newCatalogGetCommand(o),
		newCatalogDelCommand(o),
		newCatalogSyncCommand(o),
		newCatalogListPkgCommand(o),
	)
	return cmd

}

func newCatalogPutCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.PutCatalogRequest{
		Catalog: &model.Catalog{},
	}

	cmd := &cobra.Command{
		Use:   "put [NAME] [flags]",
		Short: "Add a catalog or update existing one",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the catalog")
			}
			req.Catalog.Name = args[0]

			_, err = c.PutCatalog(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	cmd.Flags().StringVar(&req.Catalog.Desc, "desc", "", "The catalog description.")
	cmd.Flags().StringVar(&req.Catalog.Url, "url", "", "The catalog url.")
	cmd.Flags().StringVar(&req.Catalog.Rootdir, "rootdir", "", "The root directory where packages are put in the catalog repo.")
	return cmd
}

func newCatalogListCommand(o *client.Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list [flags]",
		Short: "Show the list of catalogs.",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			req := &catalogservice.ListCatalogsRequest{}
			res, err := c.ListCatalogs(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)

			return nil
		},
	}
	return cmd
}

func newCatalogGetCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.GetCatalogRequest{}

	cmd := &cobra.Command{
		Use:   "get [NAME] [flags]",
		Short: "Get a catalog",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the catalog")
			}
			req.Name = args[0]

			res, err := c.GetCatalog(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)
			return nil
		},
	}
	return cmd
}

func newCatalogDelCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.DelCatalogRequest{}

	cmd := &cobra.Command{
		Use:   "del [NAME] [flags]",
		Short: "Delete a catalog",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the catalog")
			}
			req.Name = args[0]

			_, err = c.DelCatalog(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}

func newCatalogSyncCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.SyncCatalogRequest{}

	cmd := &cobra.Command{
		Use:   "sync [NAME] [flags]",
		Short: "Sync a catalog's package list",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the catalog")
			}
			req.Name = args[0]

			_, err = c.SyncCatalog(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}

func newCatalogListPkgCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.ListPackagesRequest{}

	cmd := &cobra.Command{
		Use:   "list-pkg [NAME] [flags]",
		Short: "List packages of a catalog",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the catalog")
			}
			req.CatalogName = args[0]

			res, err := c.ListPackages(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)
			return nil
		},
	}
	return cmd
}
