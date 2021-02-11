package commands

import (
	"fmt"

	"github.com/oam-dev/velacp/pkg/version"
	"github.com/spf13/cobra"
)

type CLI struct {
	rootCmd *cobra.Command
}

func NewCLI(name, desc string) *CLI {
	a := &CLI{
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

func (c *CLI) setGlobalFlags() {
	// set global flags here
}

func (c *CLI) AddCommands(cmds ...*cobra.Command) {
	for _, cmd := range cmds {
		c.rootCmd.AddCommand(cmd)
	}
}

func (c *CLI) Run() error {
	return c.rootCmd.Execute()
}
