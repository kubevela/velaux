// +title=Requests and limits
// +description=CPU and memory each workload requests across its replicas, and workloads that set no requests or limits
// +chart=bar
// +chart:x=app
// +chart:y=cpu
// +chart:title=CPU requested (cores) by application
import (
	"list"
	"math"
	"strings"
	"vela/report"
)

template: {
	deployments:  report.#List & {$params: {apiVersion: "apps/v1", kind: "Deployment"}}
	statefulsets: report.#List & {$params: {apiVersion: "apps/v1", kind: "StatefulSet"}}

	rows: [...{
		// +title=Workload
		workload: string
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Replicas
		replicas: int
		// +title=CPU requested (cores)
		cpu: number
		// +title=Memory requested (MiB)
		memory: number
		// +title=CPU limit (cores)
		cpuLimit: number
		// +title=Memory limit (MiB)
		memoryLimit: number
		// +title=Not set
		missing: string
		// +title=Namespace
		namespace: string
		kind:      string
	}]
	workloads: list.Concat([
		[for d in deployments.$returns {k: "Deployment", item: d}],
		[for x in statefulsets.$returns {k: "StatefulSet", item: x}],
	])
	rows: list.Sort([for w in workloads
		let spec = w.item.object.spec
		let containers = [if spec.template.spec.containers != _|_ {spec.template.spec.containers}, []][0]
		let replicas = [if spec.replicas != _|_ {spec.replicas}, 1][0]
		let res = [for c in containers {[if c.resources != _|_ {c.resources}, {}][0]}]
		let req = [for r in res {[if r.requests != _|_ {r.requests}, {}][0]}]
		let lim = [for r in res {[if r.limits != _|_ {r.limits}, {}][0]}]
		let missing = list.Concat([
			[if len([for r in req if r.cpu == _|_ {r}]) > 0 {"CPU request"}],
			[if len([for r in req if r.memory == _|_ {r}]) > 0 {"memory request"}],
			[if len([for l in lim if l.memory == _|_ {l}]) > 0 {"memory limit"}],
		]) {
			workload:    w.item.object.metadata.name
			kind:        w.k
			app:         [if w.item.object.metadata.labels["app.oam.dev/name"] != _|_ {w.item.object.metadata.labels["app.oam.dev/name"]}, ""][0]
			namespace:   "\(w.item.cluster)/\(w.item.namespace)"
			"replicas":  replicas
			cpu:         math.Round(1000*replicas*list.Sum([for r in req if r.cpu != _|_ {(report.#CPU & {in: r.cpu}).out}])) / 1000
			memory:      math.Round(replicas * list.Sum([for r in req if r.memory != _|_ {(report.#Memory & {in: r.memory}).out}]))
			cpuLimit:    math.Round(1000*replicas*list.Sum([for l in lim if l.cpu != _|_ {(report.#CPU & {in: l.cpu}).out}])) / 1000
			memoryLimit: math.Round(replicas * list.Sum([for l in lim if l.memory != _|_ {(report.#Memory & {in: l.memory}).out}]))
			"missing":   strings.Join(missing, ", ")
		}], {x: {}, y: {}, less: x.cpu > y.cpu})

	stats: [
		{label: "CPU requested (cores)", value: math.Round(1000 * list.Sum([for r in rows {r.cpu}])) / 1000},
		{label: "Memory requested (MiB)", value: math.Round(list.Sum([for r in rows {r.memory}]))},
		{label: "Workloads missing requests or limits", value: len([for r in rows if r.missing != "" {r}]), tone: [if len([for r in rows if r.missing != "" {r}]) > 0 {"progressing"}, "healthy"][0]},
	]
}
