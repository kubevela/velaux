// +title=Restarting pods
// +description=Containers crash looping, failing to pull or start, or restarting often
// +chart=bar
// +chart:x=app
// +chart:y=restarts
// +chart:title=Restarts by application
import (
	"list"
	"vela/report"
)

template: {
	parameter: {
		// +usage=Restarts at which a container is listed even when it is running now
		// +ui:label=Restarts to list
		restarts: *3 | int & >=1
	}
	pods: report.#List & {$params: {apiVersion: "v1", kind: "Pod"}}

	stuck: ["CrashLoopBackOff", "ImagePullBackOff", "ErrImagePull", "CreateContainerConfigError", "CreateContainerError", "RunContainerError"]

	rows: [...{
		// +title=Pod
		pod: string
		// +title=Container
		container: string
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Restarts
		restarts: int
		// +title=Now
		reason: string
		// +title=Last exit
		lastExit: string
		// +title=Namespace
		namespace: string
	}]
	rows: list.Sort([for p in pods.$returns
		let statuses = [if p.object.status.containerStatuses != _|_ {p.object.status.containerStatuses}, []][0]
		for c in statuses
		let reason = [if c.state.waiting != _|_ if c.state.waiting.reason != _|_ {c.state.waiting.reason}, ""][0]
		if c.restartCount >= parameter.restarts || list.Contains(stuck, reason) {
			pod:       p.object.metadata.name
			container: c.name
			app:       [if p.object.metadata.labels["app.oam.dev/name"] != _|_ {p.object.metadata.labels["app.oam.dev/name"]}, ""][0]
			restarts:  c.restartCount
			"reason":  [if reason != "" {reason}, "Running"][0]
			lastExit:  [if c.lastState.terminated != _|_ if c.lastState.terminated.reason != _|_ {c.lastState.terminated.reason}, ""][0]
			namespace: "\(p.cluster)/\(p.namespace)"
		}], {x: {}, y: {}, less: x.restarts > y.restarts})

	stats: [
		{label: "Containers listed", value: len(rows), tone: [if len(rows) > 0 {"unhealthy"}, "healthy"][0]},
		{label: "Stuck now", value: len([for r in rows if list.Contains(stuck, r.reason) {r}])},
	]
}
