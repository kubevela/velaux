// +title=Running images
// +description=The images and tags running in the project, flagging latest tags and images running at more than one tag
// +chart=pie
// +chart:x=tag
// +chart:title=Containers by tag
import (
	"list"
	"strings"
	"vela/report"
)

template: {
	pods: report.#List & {$params: {apiVersion: "v1", kind: "Pod"}}

	// #Image splits an image reference into its repository and its tag or digest.
	#Image: {
		ref: string
		let at = strings.Index(ref, "@")
		let slash = strings.LastIndex(ref, "/")
		let colon = strings.LastIndex(ref, ":")
		repository: [
			if at >= 0 {strings.SliceRunes(ref, 0, at)},
			if colon > slash {strings.SliceRunes(ref, 0, colon)},
			ref,
		][0]
		tag: [
			if at >= 0 {"digest"},
			if colon > slash {strings.SliceRunes(ref, colon+1, len(ref))},
			"latest (implied)",
		][0]
	}

	containers: {
		for p in pods.$returns if p.object.spec.containers != _|_ for c in p.object.spec.containers {
			let app = [if p.object.metadata.labels["app.oam.dev/name"] != _|_ {p.object.metadata.labels["app.oam.dev/name"]}, ""][0]
			"\(app)/\(c.name)/\(c.image)": {
				"app":     app
				container: c.name
				image:     c.image
			}
		}
	}
	all: [for _, c in containers
		let img = #Image & {ref: c.image} {
			app:        c.app
			container:  c.container
			repository: img.repository
			tag:        img.tag
		}]
	tagsOf: {for c in all {"\(c.repository)": "\(c.tag)": true}}

	rows: [...{
		// +title=Repository
		repository: string
		// +title=Tag
		tag: string
		// +title=Application
		// +link=/applications/{app}/config
		app: string
		// +title=Container
		container: string
		// +title=Flag
		flag: string
	}]
	rows: list.Sort([for c in all {
		c
		flag: [
			if strings.HasPrefix(c.tag, "latest") {"Uses latest"},
			if len([for t, _ in tagsOf[c.repository] {t}]) > 1 {"Several tags in use"},
			"",
		][0]
	}], {x: {}, y: {}, less: x.repository+x.tag < y.repository+y.tag})

	stats: [
		{label: "Images", value: len([for r, _ in tagsOf {r}])},
		{label: "Using latest", value: len([for r in rows if r.flag == "Uses latest" {r}]), tone: [if len([for r in rows if r.flag == "Uses latest" {r}]) > 0 {"progressing"}, "healthy"][0]},
		{label: "Several tags in use", value: len([for r, tags in tagsOf if len([for t, _ in tags {t}]) > 1 {r}])},
	]
}
