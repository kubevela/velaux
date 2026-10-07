// +title=Waiting on someone
// +description=Workflows suspended for an approval or input, and how long they have waited
// +chart=bar
// +chart:x=app
// +chart:y=minutes
// +chart:title=Minutes waiting
import (
	"list"
	"vela/report"
)

template: {
	runs: report.#Runs

	rows: [...{
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Run
		// +link=/applications/{app}/envbinding/{env}/workflow/records/{run}
		run: string
		// +title=Waiting at
		step: string
		// +title=Waiting for
		// +format=duration
		waited: int
		// +title=Started by
		user: string
		env:     string
		minutes: int
	}]
	rows: list.Sort([for r in runs.$returns if r.status == "suspending"
		let waiting = [for s in *r.steps | [] if s.phase == "suspending" {s}]
		if len(waiting) > 0
		let s = waiting[0] {
			app:     r.app
			run:     r.name
			step:    [if s.alias != _|_ {s.alias}, s.name][0]
			waited:  s.seconds
			user:    [if r.user != _|_ {r.user}, ""][0]
			env:     [if r.env != _|_ {r.env}, ""][0]
			minutes: div(s.seconds, 60)
		}], {x: {}, y: {}, less: x.waited > y.waited})

	stats: [
		{label: "Waiting", value: len(rows), tone: [if len(rows) > 0 {"progressing"}, "healthy"][0]},
		{label: "Longest wait", format: "duration", value: [if len(rows) > 0 {rows[0].waited}, null][0]},
	]
}
