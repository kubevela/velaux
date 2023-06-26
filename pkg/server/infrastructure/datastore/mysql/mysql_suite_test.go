/*
Copyright 2021 The KubeVela Authors.

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

package mysql

import (
	"context"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

func TestMySQL(t *testing.T) {
	_, err := New(context.TODO(), datastore.Config{
		URL:      "root:kubevelaSQL123@tcp(127.0.0.1:3306)/kubevela?parseTime=True",
		Database: "kubevela",
	})
	if err != nil {
		t.Fatal(err)
	}

	RegisterFailHandler(Fail)
	RunSpecs(t, "MySQL Suite")
}
