// +title=Autoscaler saturation
// +description=Autoscalers at their maximum, with no room to grow, or running above their CPU target
// +chart=bar
// +chart:x=name
// +chart:y=replicas
// +chart:title=Replicas now
import "vela/report"

template: {
	parameter: {
		// +usage=Show every autoscaler, not only the saturated ones
		// +ui:label=Include those with headroom
		all: *false | bool
	}
	autoscalers: report.#List & {$params: {apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler"}}

	all: [for h in autoscalers.$returns
		let spec = h.object.spec
		let status = [if h.object.status != _|_ {h.object.status}, {}][0]
		let replicas = [if status.currentReplicas != _|_ {status.currentReplicas}, 0][0]
		let cpu = [if status.currentCPUUtilizationPercentage != _|_ {status.currentCPUUtilizationPercentage}, null][0]
		let target = [if spec.targetCPUUtilizationPercentage != _|_ {spec.targetCPUUtilizationPercentage}, null][0] {
			name:      h.object.metadata.name
			app:       [if h.object.metadata.labels["app.oam.dev/name"] != _|_ {h.object.metadata.labels["app.oam.dev/name"]}, ""][0]
			namespace: "\(h.cluster)/\(h.namespace)"
			"replicas": replicas
			bounds:    "\([if spec.minReplicas != _|_ {spec.minReplicas}, 1][0])-\(spec.maxReplicas)"
			"cpu":     cpu
			"target":  target
			state: [
				if replicas >= spec.maxReplicas {"At maximum"},
				if cpu != null if target != null if cpu > target {"Above CPU target"},
				"Has headroom",
			][0]
		}]

	stats: [
		{label: "Autoscalers", value: len(all)},
		{label: "At maximum", value: len([for a in all if a.state == "At maximum" {a}]), tone: [if len([for a in all if a.state == "At maximum" {a}]) > 0 {"unhealthy"}, "healthy"][0]},
		{label: "Above CPU target", value: len([for a in all if a.state == "Above CPU target" {a}])},
	]

	rows: [...{
		// +title=Autoscaler
		name: string
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=State
		state: string
		// +title=Replicas
		replicas: int
		// +title=Min-max
		bounds: string
		// +title=CPU now
		// +format=percent
		cpu: number | null
		// +title=CPU target
		// +format=percent
		target: number | null
		// +title=Namespace
		namespace: string
	}]
	rows: [for a in all if parameter.all || a.state != "Has headroom" {a}]
}
