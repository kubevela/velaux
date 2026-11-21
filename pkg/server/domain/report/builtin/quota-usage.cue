// +title=Quota usage
// +description=How much of each ResourceQuota in the project's namespaces is used
// +chart=bar
// +chart:x=label
// +chart:y=percent
// +chart:title=Used, percent of the quota
import (
	"list"
	"math"
	"strconv"
	"strings"
	"vela/report"
)

template: {
	quotas: report.#List & {$params: {apiVersion: "v1", kind: "ResourceQuota"}}

	// #Amount reads a quota quantity for its resource: CPU in cores, memory and
	// storage in MiB, anything else as a count.
	#Amount: {
		resource: string
		in:       string | number
		out: [
			if resource == "cpu" || strings.HasSuffix(resource, ".cpu") {(report.#CPU & {"in": in}).out},
			if resource == "memory" || strings.HasSuffix(resource, ".memory") || strings.HasSuffix(resource, "storage") {(report.#Memory & {"in": in}).out},
			if (in & number) != _|_ {in},
			if (in & string) != _|_ {strconv.ParseFloat(in, 64)},
		][0]
	}

	rows: [...{
		// +title=Quota
		quota: string
		// +title=Resource
		resource: string
		// +title=Used
		used: string
		// +title=Of
		hard: string
		// +title=Used (percent)
		// +format=percent
		percent: number
		// +title=Namespace
		namespace: string
		label:     string
	}]
	rows: list.Sort([for q in quotas.$returns
		let status = [if q.object.status != _|_ {q.object.status}, {}][0]
		let hard = [if status.hard != _|_ {status.hard}, {}][0]
		let used = [if status.used != _|_ {status.used}, {}][0]
		for r, h in hard
		let u = [if used[r] != _|_ {used[r]}, "0"][0]
		let hv = (#Amount & {resource: r, in: h}).out
		let uv = (#Amount & {resource: r, in: u}).out {
			quota:     q.object.metadata.name
			resource:  r
			"used":    "\(u)"
			"hard":    "\(h)"
			percent:   [if hv > 0 {math.Round(100 * uv / hv)}, 0][0]
			namespace: "\(q.cluster)/\(q.namespace)"
			label:     "\(q.object.metadata.name) \(r)"
		}], {x: {}, y: {}, less: x.percent > y.percent})

	stats: [
		{label: "Highest use", format: "percent", value: [if len(rows) > 0 {rows[0].percent}, null][0], tone: [if len(rows) > 0 if rows[0].percent >= 90 {"unhealthy"}, if len(rows) > 0 if rows[0].percent >= 75 {"progressing"}, "healthy"][0]},
		{label: "Near the limit (75% or more)", value: len([for r in rows if r.percent >= 75 {r}])},
	]
}
