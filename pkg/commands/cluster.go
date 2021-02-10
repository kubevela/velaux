package commands

import (
	"context"
	"encoding/base64"
	"errors"
	"io/ioutil"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/client"
	"github.com/oam-dev/velacp/pkg/datastore/model"
	"github.com/oam-dev/velacp/pkg/proto/clusterservice"
)

func NewClusterCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "cluster",
		Short: "Manage k8s cluster resources.",
	}

	o := &client.Options{}
	o.RegisterPersistentFlags(cmd)

	cmd.AddCommand(
		newClusterPutCommand(o),
		newClusterListCommand(o),
		newClusterGetCommand(o),
		newClusterDelCommand(o),
	)
	return cmd

}

func newClusterPutCommand(o *client.Options) *cobra.Command {
	req := &clusterservice.PutClusterRequest{
		Cluster: &model.Cluster{},
	}

	var configFilePath string

	cmd := &cobra.Command{
		Use:   "put [NAME] [flags]",
		Short: "Add a cluster or update existing one",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewClusterClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the cluster")
			}
			req.Cluster.Name = args[0]

			b, err := ioutil.ReadFile(configFilePath)
			if err != nil {
				return err
			}
			encoded := base64.StdEncoding.EncodeToString(b)
			req.Cluster.Kubeconfig = encoded

			_, err = c.PutCluster(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	cmd.Flags().StringVar(&configFilePath, "kubeconfig-path", "", "The file path of kubeconfig")
	return cmd
}

func newClusterListCommand(o *client.Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list [flags]",
		Short: "Show the list of clusters.",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewClusterClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			req := &clusterservice.ListClustersRequest{}
			res, err := c.ListClusters(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)

			return nil
		},
	}
	return cmd
}

func newClusterGetCommand(o *client.Options) *cobra.Command {
	req := &clusterservice.GetClusterRequest{}

	cmd := &cobra.Command{
		Use:   "get [NAME] [flags]",
		Short: "Get a cluster",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewClusterClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the cluster")
			}
			req.Name = args[0]

			res, err := c.GetCluster(ctx, req)
			if err != nil {
				return err
			}

			printResult(res)
			return nil
		},
	}
	return cmd
}

func newClusterDelCommand(o *client.Options) *cobra.Command {
	req := &clusterservice.DelClusterRequest{}

	cmd := &cobra.Command{
		Use:   "del [NAME] [flags]",
		Short: "Delete a cluster",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			c, conn, err := o.NewClusterClient(ctx)
			if err != nil {
				return err
			}
			defer conn.Close()

			if len(args) < 1 {
				return errors.New("must specify name for the cluster")
			}
			req.Name = args[0]

			_, err = c.DelCluster(ctx, req)
			if err != nil {
				return err
			}
			return nil
		},
	}
	return cmd
}
