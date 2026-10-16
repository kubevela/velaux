// +title=Environment drift
// +description=Environments whose last deploy failed, running an older deploy than another, or not running the application as it is now
// +chart=pie
// +chart:x=state
// +chart:title=Environments by state
import (
	"list"
	"vela/report"
)

template: {
	parameter: {
		// +usage=Show environments that are up to date as well
		// +ui:label=Include those up to date
		all: *false | bool
	}
	environments: report.#Environments
	latestOf: {
		for e in environments.$returns if e.deployedAt != _|_ {
			"\(e.app)": list.SortStrings([for o in environments.$returns if o.app == e.app if o.deployedAt != _|_ {o.deployedAt}])
		}
	}

	all: [for e in environments.$returns
		let at = [if e.deployedAt != _|_ {e.deployedAt}, ""][0]
		let latest = [if latestOf[e.app] != _|_ {latestOf[e.app][len(latestOf[e.app])-1]}, ""][0] {
			app:        e.app
			env:        e.env
			revision:   [if e.revision != _|_ {e.revision}, ""][0]
			deployedAt: at
			user:       [if e.user != _|_ {e.user}, ""][0]
			state: [
				if at == "" {"Never deployed"},
				if e.status != _|_ if e.status == "failure" {"Last deploy failed"},
				if e.edited {"Changed since deployed"},
				if at < latest {"Behind another environment"},
				"Up to date",
			][0]
		}]

	stats: [
		{label: "Environments", value: len(all)},
		{label: "Drifted", value: len([for e in all if e.state != "Up to date" {e}]), tone: [if len([for e in all if e.state != "Up to date" {e}]) > 0 {"progressing"}, "healthy"][0]},
	]

	rows: [...{
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Environment
		// +link=/applications/{app}/envbinding/{env}/status
		env: string
		// +title=State
		state: string
		// +title=Deployed revision
		revision: string
		// +title=Deployed
		// +format=time
		deployedAt: string
		// +title=By
		user: string
	}]
	rows: [for e in all if parameter.all || e.state != "Up to date" {e}]
}
