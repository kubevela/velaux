package server

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/datastore/mongodb"
	"github.com/oam-dev/velacp/pkg/rest"
)

type server struct {
	dataStoreCfg datastore.Config
	restCfg      rest.Config
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

	// rest
	cmd.Flags().IntVar(&s.restCfg.Port, "port", 8000, "The port number used to serve the http APIs.")

	// datastore
	cmd.Flags().StringVar(&s.dataStoreCfg.URL, "db-url", s.dataStoreCfg.URL, "The login url of the database")
	_ = cmd.MarkFlagRequired("db-address")
	cmd.Flags().StringVar(&s.dataStoreCfg.Database, "db-name", s.dataStoreCfg.Database, "The name of the database")
	_ = cmd.MarkFlagRequired("db-name")

	return cmd
}

func (s *server) run() error {
	ctx := context.Background()

	d, err := mongodb.New(ctx, s.dataStoreCfg)
	if err != nil {
		return err
	}

	server, err := rest.New(d, s.restCfg)
	if err != nil {
		return fmt.Errorf("create server failed : %s ", err.Error())
	}
	return server.Run(ctx)
}
