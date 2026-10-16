// +title=Recent changes
// +description=Who deployed what, and when, with the note and what triggered it
import (
	"list"
	"vela/report"
)

template: {
	parameter: {
		// +usage=How many of the latest deploys to show
		// +ui:label=How many
		count: *50 | int & >=1 & <=500
	}
	runs: report.#Runs

	sorted: list.Sort([for r in runs.$returns {
		started:  [if r.started != _|_ {r.started}, ""][0]
		app:      r.app
		env:      [if r.env != _|_ {r.env}, ""][0]
		run:      r.name
		revision: [if r.revision != _|_ {r.revision}, ""][0]
		user:     [if r.user != _|_ {r.user}, ""][0]
		trigger:  [if r.trigger != _|_ {r.trigger}, ""][0]
		note:     [if r.note != _|_ {r.note}, ""][0]
		status:   r.status
	}], {x: {}, y: {}, less: x.started > y.started})

	rows: [...{
		// +title=When
		// +format=time
		started: string
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Environment
		env: string
		// +title=Revision
		// +link=/applications/{app}/envbinding/{env}/workflow/records/{run}
		revision: string
		// +title=By
		user: string
		// +title=Trigger
		trigger: string
		// +title=Note
		note: string
		// +title=Status
		// +format=badge
		status: string
		run:    string
	}]
	rows: list.Take(sorted, parameter.count)
}
