package velactl

import (
	"log"

	"github.com/oam-dev/velacp/pkg/commands"
	catalogcmd "github.com/oam-dev/velacp/pkg/commands/catalog"
)

func main() {
	app := commands.NewApp(
		"velactl",
		"KubeVela CLI tool",
	)
	app.AddCommands(
		catalogcmd.NewCatalogCommand(),
	)
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}