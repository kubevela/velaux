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
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"sort"
	"strconv"

	"cuelang.org/go/cue"
	"github.com/kubevela/pkg/cue/cuex"

	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
)

var (
	rowsPath      = cue.ParsePath("template.rows")
	statsPath     = cue.ParsePath("template.stats")
	linkField     = regexp.MustCompile(`\{([A-Za-z_][A-Za-z0-9_]*)\}`)
	parameterPath = "template.parameter"
)

// Run runs a report over the project source holds, with the given parameters.
// The result has the report's columns, its rows with their links, and its
// chart; its meta is the caller's.
func Run(ctx context.Context, src string, source Source, parameters map[string]interface{}) (*apisv1.ReportResult, error) {
	spec, err := ParseSpec(src)
	if err != nil {
		return nil, err
	}
	val, err := compiler.CompileStringWithOptions(WithSource(ctx, source), src, cuex.WithData(parameterPath, parameters))
	if err != nil {
		return nil, err
	}
	var rows []map[string]interface{}
	rowsVal := val.LookupPath(rowsPath)
	if err := rowsVal.Decode(&rows); err != nil {
		return nil, fmt.Errorf("the report's rows: %w", err)
	}

	result := &apisv1.ReportResult{Rows: []apisv1.ReportRow{}}
	if stats := val.LookupPath(statsPath); stats.Exists() {
		if err := stats.Decode(&result.Stats); err != nil {
			return nil, fmt.Errorf("the report's stats: %w", err)
		}
	}
	for _, c := range spec.Columns {
		result.Columns = append(result.Columns, apisv1.ReportColumn{Key: c.Key, Title: c.Title, Format: c.Format})
	}
	for _, row := range rows {
		out := apisv1.ReportRow{Values: map[string]interface{}{}}
		for _, c := range spec.Columns {
			if v, ok := row[c.Key]; ok {
				out.Values[c.Key] = v
			}
			if c.Link != "" {
				if link, ok := fillLink(c.Link, row); ok {
					if out.Links == nil {
						out.Links = map[string]string{}
					}
					out.Links[c.Key] = link
				}
			}
		}
		result.Rows = append(result.Rows, out)
	}
	if spec.Chart != nil {
		result.Chart = chartOf(spec.Chart, rows)
	}
	return result, nil
}

// fillLink fills a link's {field}s from the row, or is false where the row
// lacks one.
func fillLink(link string, row map[string]interface{}) (string, bool) {
	ok := true
	out := linkField.ReplaceAllStringFunc(link, func(m string) string {
		v, found := row[m[1:len(m)-1]]
		if !found || v == nil || fmt.Sprint(v) == "" {
			ok = false
			return ""
		}
		return fmt.Sprint(v)
	})
	return out, ok
}

// chartOf sums Y (or counts rows) per X, a series per Group value, points and
// series in label order.
func chartOf(spec *ChartSpec, rows []map[string]interface{}) *apisv1.ReportChart {
	chart := &apisv1.ReportChart{Type: spec.Type, Title: spec.Title, Series: []string{}, Points: []apisv1.ReportPoint{}}
	points := map[string]map[string]float64{}
	series := map[string]bool{}
	for _, row := range rows {
		x, ok := row[spec.X]
		if !ok {
			continue
		}
		name := "count"
		if spec.Group != "" {
			name = fmt.Sprint(row[spec.Group])
		} else if spec.Y != "" {
			name = spec.Y
		}
		value := 1.0
		if spec.Y != "" {
			value = number(row[spec.Y])
		}
		label := fmt.Sprint(x)
		if points[label] == nil {
			points[label] = map[string]float64{}
		}
		points[label][name] += value
		series[name] = true
	}
	for label, values := range points {
		chart.Points = append(chart.Points, apisv1.ReportPoint{Label: label, Values: values})
	}
	sort.Slice(chart.Points, func(i, j int) bool { return chart.Points[i].Label < chart.Points[j].Label })
	for name := range series {
		chart.Series = append(chart.Series, name)
	}
	sort.Strings(chart.Series)
	return chart
}

func number(v interface{}) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case int:
		return float64(n)
	case int64:
		return float64(n)
	case json.Number:
		f, _ := n.Float64()
		return f
	case string:
		f, _ := strconv.ParseFloat(n, 64)
		return f
	}
	return 0
}
