package commands

import (
	"fmt"

	"github.com/oam-dev/velacp/pkg/version"
	"github.com/spf13/cobra"
)

type App struct {
	rootCmd *cobra.Command
}

func NewApp(name, desc string) *App {
	a := &App{
		rootCmd: &cobra.Command{
			Use:           name,
			Short:         desc,
			SilenceErrors: true,
		},
	}
	versionCmd := &cobra.Command{
		Use:   "version",
		Short: "Print the information of current binary.",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println(version.Get())
		},
	}
	a.rootCmd.AddCommand(versionCmd)
	a.setGlobalFlags()
	return a
}

func (a *App) setGlobalFlags() {
	// set global flags here
}

func (a *App) AddCommands(cmds ...*cobra.Command) {
	for _, cmd := range cmds {
		a.rootCmd.AddCommand(cmd)
	}
}

func (a *App) Run() error {
	return a.rootCmd.Execute()
}
