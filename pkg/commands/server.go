package commands

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/grpcapi"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

type server struct {
	logger       *zap.Logger
	dataStoreCfg datastore.Config
	grpcApiCfg   grpcapi.Config
}


func NewServerCommand() *cobra.Command {
	s := &server{}
	logger:= newLogger()
	s.logger = logger
	s.grpcApiCfg.Logger = logger

	cmd := &cobra.Command{
		Use:   "server",
		Short: "Start running server.",
		RunE: func(cmd *cobra.Command, args []string) error {
			return s.run()
		},
	}

	// grpc
	cmd.Flags().IntVar(&s.grpcApiCfg.Port, "api-port", s.grpcApiCfg.Port, "The port number used to serve the grpc APIs.")

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

func newLogger() *zap.Logger{
	c := zap.Config{
		Level:       zap.NewAtomicLevel(),
		Development: false,
		Sampling: &zap.SamplingConfig{
			Initial:    100,
			Thereafter: 100,
		},
		OutputPaths:      []string{"stderr"},
		ErrorOutputPaths: []string{"stderr"},
	}
	var opt []zap.Option
	l, err  := c.Build(opt...)
	if err != nil {
		panic(err)
	}
	return l
}

func (s *server) run() error {
	ctx := context.Background()

	d, err := datastore.New(s.dataStoreCfg)
	if err != nil {
		return err
	}

	server := grpcapi.New(d, s.grpcApiCfg)
	return server.Run(ctx)
}
