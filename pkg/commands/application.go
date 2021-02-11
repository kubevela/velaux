package commands

import (
	"context"
	"errors"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/client"
	"github.com/oam-dev/velacp/pkg/datastore/model"
	"github.com/oam-dev/velacp/pkg/proto/appservice"
)

func NewAppCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "app",
		Short: "Manage applications.",
	}

	o := &client.Options{}
	o.RegisterPersistentFlags(cmd)

	cmd.AddCommand(
		newAppPutCommand(o),
		newAppListCommand(o),
		newAppGetCommand(o),
		newAppDelCommand(o),
	)
	return cmd
}

func newAppPutCommand(o *client.Options) *cobra.Command {
	req := &appservice.PutApplicationRequest{
		App: &model.Application{},
	}

	cmd := &cobra.Command{
		Use:   "put [NAME] [flags]",
		Short: "Add a env or update existing one",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewAppClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the env")
			}
			req.App.Name = args[0]

			_, err = c.PutApplication(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}

func newAppListCommand(o *client.Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list [flags]",
		Short: "Show the list of envs.",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewAppClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			req := &appservice.ListApplicationsRequest{}
			res, err := c.ListApplications(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)

			return nil
		},
	}
	return cmd
}

func newAppGetCommand(o *client.Options) *cobra.Command {
	req := &appservice.GetApplicationRequest{}

	cmd := &cobra.Command{
		Use:   "get [NAME] [flags]",
		Short: "Get a env",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewAppClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the cluster")
			}
			req.Name = args[0]

			res, err := c.GetApplication(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)
			return nil
		},
	}
	return cmd
}

func newAppDelCommand(o *client.Options) *cobra.Command {
	req := &appservice.DelApplicationRequest{}

	cmd := &cobra.Command{
		Use:   "del [NAME] [flags]",
		Short: "Delete a env",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewAppClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the env")
			}
			req.Name = args[0]

			_, err = c.DelApplication(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}
