// +title=Type versions
// +description=Components and traits pinned to a definition version that no longer exists, which cannot render, or behind the latest
// +chart=pie
// +chart:x=state
// +chart:title=Components and traits by version state
import (
	"list"
	"strings"
	"vela/report"
)

template: {
	parameter: {
		// +usage=Show those on the latest version as well
		// +ui:label=Include those on the latest
		all: *false | bool
	}
	components:  report.#Components
	definitions: report.#Definitions
	defs: {for d in definitions.$returns {"\(d.kind)/\(d.name)": d}}

	all: [for c in components.$returns
		let parts = strings.Split(c.type, "@")
		let def = [if defs["\(c.kind)/\(parts[0])"] != _|_ {defs["\(c.kind)/\(parts[0])"]}, {versions: []}][0]
		let latest = [if def.latest != _|_ {def.latest}, ""][0]
		let pinned = [if len(parts) == 2 {parts[1]}, ""][0] {
			app:       c.app
			component: c.component
			kind:      c.kind
			type:      parts[0]
			"pinned":  [if pinned != "" {pinned}, "-"][0]
			"latest":  [if latest != "" {latest}, "-"][0]
			state: [
				if pinned == "" {"Follows the latest"},
				if !list.Contains(def.versions, pinned) {"Pinned to a missing version"},
				if pinned != latest {"Pinned behind the latest"},
				"Pinned to the latest",
			][0]
		}]

	stats: [
		{label: "Cannot render", value: len([for c in all if c.state == "Pinned to a missing version" {c}]), tone: [if len([for c in all if c.state == "Pinned to a missing version" {c}]) > 0 {"unhealthy"}, "healthy"][0]},
		{label: "Behind the latest", value: len([for c in all if c.state == "Pinned behind the latest" {c}])},
		{label: "Components and traits", value: len(all)},
	]

	rows: [...{
		// +title=Application
		// +link=/applications/{app}/config/components
		app: string
		// +title=Component
		component: string
		// +title=Kind
		kind: string
		// +title=Type
		type: string
		// +title=Pinned
		pinned: string
		// +title=Latest
		latest: string
		// +title=State
		state: string
	}]
	rows: [for c in all if parameter.all || list.Contains(["Pinned to a missing version", "Pinned behind the latest"], c.state) {c}]
}
