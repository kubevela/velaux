package main

import (
	"log"

	"github.com/oam-dev/velacp/pkg/commands"
)

func main() {
	app := commands.NewApp(
		"velacp",
		"KubeVela control plane",
	)
	app.AddCommands(
		commands.NewServerCommand(),
	)
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
