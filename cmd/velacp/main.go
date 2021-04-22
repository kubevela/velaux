package main

import (
	"log"

	"github.com/oam-dev/velacp/pkg/commands"
	"github.com/oam-dev/velacp/pkg/commands/server"
)

func main() {
	app := commands.NewCLI(
		"velacp",
		"KubeVela control plane",
	)
	app.AddCommands(
		server.NewServerCommand(),
	)
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
