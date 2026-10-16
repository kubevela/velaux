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

package bcode

// ErrReportNotFound is returned for a report the catalogue does not have.
var ErrReportNotFound = NewBcode(404, 24001, "the report does not exist")

// ErrReportInvalid is returned for a report whose CUE is not a report.
var ErrReportInvalid = NewBcode(400, 24002, "the report is not a valid report")

// ErrReportFailed is returned for a report that failed to run.
var ErrReportFailed = NewBcode(400, 24003, "the report failed")
