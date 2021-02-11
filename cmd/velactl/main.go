package main

import (
	"log"

	"github.com/oam-dev/velacp/pkg/commands"
)

func main() {
	app := commands.NewCLI(
		"velactl",
		"KubeVela CLI tool",
	)
	app.AddCommands(
		commands.NewCatalogCommand(),
		commands.NewClusterCommand(),
		commands.NewEnvCommand(),
		commands.NewAppCommand(),
	)
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
