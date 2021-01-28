package commands

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/grpcapi"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

type server struct {
	Logger       *zap.Logger
	cacheCfg     cacheConfig
	dataStoreCfg datastore.Config
	restAPICfg   restAPIConfig
}

type cacheConfig struct{}
type dataStoreConfig struct{}
type restAPIConfig struct {
	Port int
}

func NewServerCommand() *cobra.Command {
	s := &server{}

	cmd := &cobra.Command{
		Use:   "server",
		Short: "Start running server.",
		RunE: func(cmd *cobra.Command, args []string) error {
			return s.run()
		},
	}

	// grpc
	cmd.Flags().IntVar(&s.restAPICfg.Port, "api-port", s.restAPICfg.Port, "The port number used to serve the REST APIs.")

	// datastore
	cmd.Flags().StringVar(&s.dataStoreCfg.User, "db-user", s.dataStoreCfg.User, "Username for database login")
	cmd.MarkFlagRequired("db-user")
	cmd.Flags().StringVar(&s.dataStoreCfg.Password, "db-password", s.dataStoreCfg.Password, "Password for database login")
	cmd.MarkFlagRequired("db-password")
	cmd.Flags().StringVar(&s.dataStoreCfg.Address, "db-address", s.dataStoreCfg.Address, "The address of the database")
	cmd.MarkFlagRequired("db-address")
	cmd.Flags().StringVar(&s.dataStoreCfg.DBName, "db-name", s.dataStoreCfg.DBName, "Database name")
	cmd.MarkFlagRequired("db-name")

	return cmd
}

func (s *server) run() error {
	ctx := context.Background()

	d, err := datastore.New(s.dataStoreCfg)
	if err != nil {
		return err
	}

	server := grpcapi.New(d)
	return server.Run(ctx)
}
