// +title=Warning events
// +description=Warnings Kubernetes recorded in the project's namespaces, latest first; Kubernetes keeps events for about an hour
// +chart=bar
// +chart:x=reason
// +chart:y=count
// +chart:title=Warnings by reason
import (
	"list"
	"vela/report"
)

template: {
	events: report.#List & {$params: {apiVersion: "v1", kind: "Event"}}

	rows: [...{
		// +title=Last seen
		// +format=time
		seen: string
		// +title=Reason
		reason: string
		// +title=Object
		object: string
		// +title=Message
		message: string
		// +title=Count
		count: int
		// +title=Namespace
		namespace: string
	}]
	rows: list.Sort([for e in events.$returns if e.object.type == "Warning"
		let o = e.object {
			seen: [
				if (o.lastTimestamp & string) != _|_ {o.lastTimestamp},
				if (o.eventTime & string) != _|_ {o.eventTime},
				o.metadata.creationTimestamp,
			][0]
			reason:    [if o.reason != _|_ {o.reason}, ""][0]
			object:    "\(o.involvedObject.kind)/\(o.involvedObject.name)"
			message:   [if o.message != _|_ {o.message}, ""][0]
			count:     [if o.count != _|_ {o.count}, 1][0]
			namespace: "\(e.cluster)/\(e.namespace)"
		}], {x: {}, y: {}, less: x.seen > y.seen})

	stats: [
		{label: "Warnings", value: list.Sum([for r in rows {r.count}]), tone: [if len(rows) > 0 {"progressing"}, "healthy"][0]},
		{label: "Objects affected", value: len([for k, _ in {for r in rows {"\(r.namespace)/\(r.object)": true}} {k}])},
	]
}
