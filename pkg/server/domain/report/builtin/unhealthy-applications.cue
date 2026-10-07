// +title=Unhealthy applications
// +description=Applications with a component or trait that is not healthy, or a workflow that failed, and why
// +chart=bar
// +chart:x=app
// +chart:group=part
// +chart:title=Unhealthy parts by application
import (
	"list"
	"vela/report"
)

template: {
	applications: report.#List & {$params: {apiVersion: "core.oam.dev/v1beta1", kind: "Application"}}

	apps: [for a in applications.$returns
		let st = [if a.object.status != _|_ {a.object.status}, {}][0] {
			name:      a.object.metadata.name
			namespace: a.namespace
			phase:     [if st.status != _|_ {st.status}, "unknown"][0]
			services:  [if st.services != _|_ {st.services}, []][0]
		}]

	rows: [...{
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Part
		part: string
		// +title=Name
		name: string
		// +title=Application phase
		// +format=badge
		phase: string
		// +title=Why
		message: string
	}]
	rows: list.Concat([
		[for a in apps if list.Contains(["workflowFailed", "workflowTerminated"], a.phase) {
			app:     a.name
			part:    "workflow"
			name:    a.name
			phase:   a.phase
			message: "The workflow stopped at \(a.phase)"
		}],
		[for a in apps for s in a.services if !s.healthy {
			app:     a.name
			part:    "component"
			name:    s.name
			phase:   a.phase
			message: [if s.message != _|_ {s.message}, ""][0]
		}],
		[for a in apps for s in a.services if s.traits != _|_ for tr in s.traits if !tr.healthy {
			app:     a.name
			part:    "trait"
			name:    "\(s.name) / \(tr.type)"
			phase:   a.phase
			message: [if tr.message != _|_ {tr.message}, ""][0]
		}],
	])

	unhealthy: {for r in rows {"\(r.app)": true}}
	stats: [
		{label: "Applications", value: len(apps)},
		{label: "Unhealthy", value: len([for k, _ in unhealthy {k}]), tone: [if len(rows) > 0 {"unhealthy"}, "healthy"][0]},
		{label: "Unhealthy parts", value: len(rows)},
	]
}
