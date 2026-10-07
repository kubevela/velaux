import (
	"regexp"
	"strconv"
)

// Package vela/report reads the project a report runs over, and nothing else.

// #Apps are the project's applications.
#Apps: {
	#do:       "apps"
	#provider: "report"
	$params: {}
	$returns?: [...{
		name:         string
		alias?:       string
		description?: string
	}]
}

// #Components are the components and traits of the project's applications,
// with the $( ) expressions their properties hold.
#Components: {
	#do:       "components"
	#provider: "report"
	$params: {}
	$returns?: [...{
		app:       string
		component: string
		kind:      "component" | "trait"
		type:      string
		properties?: {...}
		expressions?: [...{property: string, expression: string}]
	}]
}

// #Runs are the workflow runs of the project's applications, and the revision
// each deployed. seconds is how long a run took, or has taken so far.
#Runs: {
	#do:       "runs"
	#provider: "report"
	$params: {}
	$returns?: [...{
		app:       string
		env?:      string
		workflow:  string
		name:      string
		status:    string
		started?:  string
		finished?: string
		seconds:   int
		revision?: string
		user?:     string
		note?:     string
		trigger?:  string
		steps?: [...{
			name:     string
			alias?:   string
			type?:    string
			phase:    string
			message?: string
			started?: string
			seconds:  int
		}]
	}]
}

// #Environments are each application's environments: the revision last
// deployed there, and whether the application as VelaUX would deploy it now
// differs from it (edited).
#Environments: {
	#do:       "environments"
	#provider: "report"
	$params: {}
	$returns?: [...{
		app:         string
		env:         string
		revision?:   string
		status?:     string
		deployedAt?: string
		user?:       string
		edited:      bool
	}]
}

// #Definitions are the component and trait definitions: the latest version of
// each and the versions it still has.
#Definitions: {
	#do:       "definitions"
	#provider: "report"
	$params: {}
	$returns?: [...{
		name:    string
		kind:    "component" | "trait"
		latest?: string
		versions: [...string]
	}]
}

// #List lists a kind in each of the project's namespaces, its environments'
// and its targets', read as the project.
#List: {
	#do:       "list"
	#provider: "report"
	$params: {
		apiVersion: string
		kind:       string
	}
	$returns?: [...{
		cluster:   string
		namespace: string
		object: {...}
	}]
}

// #CPU is a Kubernetes CPU quantity ("250m", "1.5", 2) in cores.
#CPU: {
	in:  string | number
	out: number
	if (in & number) != _|_ {out: in}
	if (in & string) != _|_ {
		let m = regexp.FindSubmatch("^([0-9.]+)(m?)$", in)
		out: [if m[2] == "m" {strconv.ParseFloat(m[1], 64) / 1000}, strconv.ParseFloat(m[1], 64)][0]
	}
}

// #Memory is a Kubernetes memory quantity ("256Mi", "1G", 1048576) in MiB.
#Memory: {
	in:  string | number
	out: number
	if (in & number) != _|_ {out: in / 1048576}
	if (in & string) != _|_ {
		let m = regexp.FindSubmatch("^([0-9.]+)([a-zA-Z]*)$", in)
		let scale = {
			"": 1.0 / 1048576, k: 1000.0 / 1048576, Ki: 1.0 / 1024, M: 1000000.0 / 1048576, Mi: 1.0,
			G: 1000000000.0 / 1048576, Gi: 1024.0, T: 1000000000000.0 / 1048576, Ti: 1048576.0
		}
		out: strconv.ParseFloat(m[1], 64) * scale[m[2]]
	}
}
