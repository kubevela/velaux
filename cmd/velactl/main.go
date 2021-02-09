package main

import (
	"log"

	"github.com/oam-dev/velacp/pkg/commands"
)

func main() {
	app := commands.NewApp(
		"velactl",
		"KubeVela CLI tool",
	)
	app.AddCommands(
		commands.NewCatalogCommand(),
		commands.NewClusterCommand(),
	)
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
