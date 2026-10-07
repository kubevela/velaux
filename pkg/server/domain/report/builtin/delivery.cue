// +title=Delivery
// +description=Workflow runs per day by how they ended, the success rate, how long a deploy takes, and where runs fail
// +chart=bar
// +chart:x=day
// +chart:group=status
// +chart:title=Runs per day
import (
	"list"
	"math"
	"strings"
	"vela/report"
)

template: {
	parameter: {
		// +usage=Only failed and terminated runs in the table
		// +ui:label=Failures only
		failuresOnly: *false | bool
	}
	runs: report.#Runs

	all: [for r in runs.$returns
		let at = [if r.started != _|_ {r.started}, ""][0]
		let failed = [for s in *r.steps | [] if s.phase == "failed" {s}] {
			app:      r.app
			run:      r.name
			env:      [if r.env != _|_ {r.env}, ""][0]
			status:   r.status
			step:     [if len(failed) > 0 {failed[0].name}, ""][0]
			message:  [if len(failed) > 0 if failed[0].message != _|_ {failed[0].message}, ""][0]
			started:  at
			seconds:  r.seconds
			user:     [if r.user != _|_ {r.user}, ""][0]
			day:      [if len(at) >= 10 {strings.SliceRunes(at, 0, 10)}, "-"][0]
		}]
	finished: [for r in all if list.Contains(["succeeded", "failed", "terminated"], r.status) {r}]
	succeeded: [for r in finished if r.status == "succeeded" {r.seconds}]

	stats: [
		{label: "Runs", value: len(all)},
		{label: "Success rate", format: "percent", value: [if len(finished) > 0 {math.Round(100 * len(succeeded) / len(finished))}, null][0]},
		{label: "Failed", value: len(finished) - len(succeeded), tone: [if len(finished) > len(succeeded) {"unhealthy"}, "healthy"][0]},
		{label: "Average deploy", format: "duration", value: [if len(succeeded) > 0 {math.Round(list.Avg(succeeded))}, null][0]},
	]

	rows: [...{
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Run
		// +link=/applications/{app}/envbinding/{env}/workflow/records/{run}
		run: string
		// +title=Status
		// +format=badge
		status: string
		// +title=Failed step
		step: string
		// +title=Message
		message: string
		// +title=Started
		// +format=time
		started: string
		// +title=Took
		// +format=duration
		seconds: int
		// +title=By
		user: string
		env:  string
		day:  string
	}]
	rows: list.Sort([for r in all if !parameter.failuresOnly || list.Contains(["failed", "terminated"], r.status) {r}],
		{x: {}, y: {}, less: x.started > y.started})
}
