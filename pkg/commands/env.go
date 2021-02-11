package commands

import (
	"context"
	"errors"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/client"
	"github.com/oam-dev/velacp/pkg/datastore/model"
	"github.com/oam-dev/velacp/pkg/proto/envservice"
)

func NewEnvCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "env",
		Short: "Manage environments for shared deployment resources.",
	}

	o := &client.Options{}
	o.RegisterPersistentFlags(cmd)

	cmd.AddCommand(
		newEnvPutCommand(o),
		newEnvListCommand(o),
		newEnvGetCommand(o),
		newEnvDelCommand(o),
	)
	return cmd
}

func newEnvPutCommand(o *client.Options) *cobra.Command {
	req := &envservice.PutEnvRequest{
		Env: &model.Environment{},
	}

	cmd := &cobra.Command{
		Use:   "put [NAME] [flags]",
		Short: "Add a env or update existing one",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewEnvClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the env")
			}
			req.Env.Name = args[0]

			_, err = c.PutEnv(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}

func newEnvListCommand(o *client.Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list [flags]",
		Short: "Show the list of envs.",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewEnvClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			req := &envservice.ListEnvsRequest{}
			res, err := c.ListEnvs(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)

			return nil
		},
	}
	return cmd
}

func newEnvGetCommand(o *client.Options) *cobra.Command {
	req := &envservice.GetEnvRequest{}

	cmd := &cobra.Command{
		Use:   "get [NAME] [flags]",
		Short: "Get a env",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewEnvClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the cluster")
			}
			req.Name = args[0]

			res, err := c.GetEnv(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)
			return nil
		},
	}
	return cmd
}

func newEnvDelCommand(o *client.Options) *cobra.Command {
	req := &envservice.DelEnvRequest{}

	cmd := &cobra.Command{
		Use:   "del [NAME] [flags]",
		Short: "Delete a env",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewEnvClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the env")
			}
			req.Name = args[0]

			_, err = c.DelEnv(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}
