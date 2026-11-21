/*
Copyright 2026 The KubeVela Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package report

import (
	"fmt"
	"strconv"
	"strings"

	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/parser"
)

// Spec is what a report's markers declare: its name, its chart and its
// columns.
type Spec struct {
	Title       string
	Description string
	Chart       *ChartSpec
	// Columns are the row fields with a +title, in the order declared.
	Columns []Column
	// Fields are every row field, column or not.
	Fields []string
}

// ChartSpec is a report's chart: Y summed per X, a series per Group, or the
// count of rows per X where Y is unset.
type ChartSpec struct {
	Type  string
	X     string
	Y     string
	Group string
	Title string
}

// Column is a column of a report's table. Link may name the row's fields as
// {field}.
type Column struct {
	Key    string
	Title  string
	Link   string
	Format string
}

var (
	chartTypes = map[string]bool{"bar": true, "line": true, "pie": true, "none": true}
	formats    = map[string]bool{"time": true, "duration": true, "percent": true, "badge": true}
)

// ParseSpec reads a report's markers, refusing a report that imports anything
// but vela/report and CUE's own packages, or that declares no rows.
func ParseSpec(src string) (*Spec, error) {
	f, err := parser.ParseFile("report.cue", src, parser.ParseComments)
	if err != nil {
		return nil, err
	}
	for _, imp := range f.Imports {
		path, err := strconv.Unquote(imp.Path.Value)
		if err != nil {
			return nil, err
		}
		if !importAllowed(path) {
			return nil, fmt.Errorf("a report may import only %q and CUE's own packages, not %q", PackageName, path)
		}
	}
	spec := &Spec{}
	reportMarkers := markersOf(ast.Comments(f))
	for _, decl := range f.Decls {
		reportMarkers = append(reportMarkers, markersOf(ast.Comments(decl))...)
	}
	for _, m := range reportMarkers {
		switch m.key {
		case "title":
			spec.Title = m.value
		case "description":
			spec.Description = m.value
		case "chart":
			if !chartTypes[m.value] {
				return nil, fmt.Errorf("+chart=%s: a chart is bar, line, pie or none", m.value)
			}
			spec.chart().Type = m.value
		case "chart:x":
			spec.chart().X = m.value
		case "chart:y":
			spec.chart().Y = m.value
		case "chart:group":
			spec.chart().Group = m.value
		case "chart:title":
			spec.chart().Title = m.value
		}
	}

	fields := rowFields(f)
	if fields == nil {
		return nil, fmt.Errorf("a report declares its rows as template: rows: [...{...}]")
	}
	for _, field := range fields {
		name, _, err := ast.LabelName(field.Label)
		if err != nil {
			return nil, err
		}
		spec.Fields = append(spec.Fields, name)
		column := Column{Key: name}
		for _, m := range markersOf(ast.Comments(field)) {
			switch m.key {
			case "title":
				column.Title = m.value
			case "link":
				column.Link = m.value
			case "format":
				if !formats[m.value] {
					return nil, fmt.Errorf("%s: +format=%s: a format is time, duration, percent or badge", name, m.value)
				}
				column.Format = m.value
			}
		}
		if column.Title != "" {
			spec.Columns = append(spec.Columns, column)
		}
	}

	if spec.Chart != nil {
		if spec.Chart.Type == "" || spec.Chart.Type == "none" {
			spec.Chart = nil
		} else if err := spec.checkChart(); err != nil {
			return nil, err
		}
	}
	return spec, nil
}

func (s *Spec) chart() *ChartSpec {
	if s.Chart == nil {
		s.Chart = &ChartSpec{}
	}
	return s.Chart
}

func (s *Spec) checkChart() error {
	if s.Chart.X == "" {
		return fmt.Errorf("+chart=%s needs +chart:x, the field it plots along", s.Chart.Type)
	}
	for marker, name := range map[string]string{"x": s.Chart.X, "y": s.Chart.Y, "group": s.Chart.Group} {
		if name != "" && !s.hasField(name) {
			return fmt.Errorf("+chart:%s=%s: rows have no field %s", marker, name, name)
		}
	}
	return nil
}

func (s *Spec) hasField(name string) bool {
	for _, f := range s.Fields {
		if f == name {
			return true
		}
	}
	return false
}

// importAllowed is vela/report or a CUE package, which has no domain and is
// not one of KubeVela's.
func importAllowed(path string) bool {
	if path == PackageName {
		return true
	}
	first := strings.SplitN(path, "/", 2)[0]
	return first != "vela" && !strings.Contains(first, ".")
}

// rowFields are the fields of the struct in template: rows: [...{...}].
func rowFields(f *ast.File) []*ast.Field {
	for _, tmpl := range fieldsNamed(f.Decls, "template") {
		body, ok := tmpl.Value.(*ast.StructLit)
		if !ok {
			continue
		}
		for _, rows := range fieldsNamed(body.Elts, "rows") {
			list, ok := rows.Value.(*ast.ListLit)
			if !ok {
				continue
			}
			for _, elt := range list.Elts {
				ellipsis, ok := elt.(*ast.Ellipsis)
				if !ok {
					continue
				}
				if row, ok := ellipsis.Type.(*ast.StructLit); ok {
					return fieldsNamed(row.Elts, "")
				}
			}
		}
	}
	return nil
}

// fieldsNamed are the fields among decls with the given name, or all of them
// for "".
func fieldsNamed(decls []ast.Decl, name string) []*ast.Field {
	var out []*ast.Field
	for _, d := range decls {
		field, ok := d.(*ast.Field)
		if !ok {
			continue
		}
		if label, _, err := ast.LabelName(field.Label); err == nil && (name == "" || label == name) {
			out = append(out, field)
		}
	}
	return out
}

type marker struct{ key, value string }

// markersOf reads // +key=value lines.
func markersOf(groups []*ast.CommentGroup) []marker {
	var out []marker
	for _, g := range groups {
		for _, c := range g.List {
			text := strings.TrimSpace(strings.TrimPrefix(c.Text, "//"))
			if !strings.HasPrefix(text, "+") {
				continue
			}
			key, value, _ := strings.Cut(strings.TrimPrefix(text, "+"), "=")
			out = append(out, marker{key: strings.TrimSpace(key), value: strings.TrimSpace(value)})
		}
	}
	return out
}
