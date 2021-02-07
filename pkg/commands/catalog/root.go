package catalog

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

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
		newPutCommand(o),
		newListCommand(o),
		newGetCommand(o),
		newDelCommand(o),
		newSyncCommand(o),
		newListPkgCommand(o),
		newInstallPkgCommand(o),
	)
	return cmd

}

func newPutCommand(o *client.Options) *cobra.Command {
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

func newListCommand(o *client.Options) *cobra.Command {
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

func newGetCommand(o *client.Options) *cobra.Command {
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

func newDelCommand(o *client.Options) *cobra.Command {
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

func newSyncCommand(o *client.Options) *cobra.Command {
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

func newListPkgCommand(o *client.Options) *cobra.Command {
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

func newInstallPkgCommand(o *client.Options) *cobra.Command {
	req := &catalogservice.InstallPackageRequest{}

	cmd := &cobra.Command{
		Use:   "install-pkg [CATALOG_NAME] [PACKAGE_NAME@VERSION] [flags]",
		Short: "Install a packages from a catalog to a cluster",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewCatalogClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 2 {
				return errors.New("must specify catalog name and pkg name")
			}
			req.CatalogName = args[0]
			subs := strings.SplitN(args[1], "@", 2)
			req.PackageName = subs[0]
			if len(subs) > 1 {
				req.PackageVersion = subs[1]
			}
			// TODO: select a cluster to install

			res, err := c.InstallPackage(ctx, req)
			if err != nil {
				return err
			}
			printResult(res)
			return nil
		},
	}
	return cmd
}

func printResult(res interface{}) {
	b, err := json.MarshalIndent(res, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(b))
}
