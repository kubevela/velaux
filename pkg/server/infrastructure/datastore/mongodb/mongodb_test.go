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

package mongodb

import (
	"context"
	"math/rand"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

var mongodbDriver datastore.DataStore
var _ = BeforeSuite(func(ctx SpecContext) {
	rand.Seed(time.Now().UnixNano())
	By("bootstrapping mongodb test environment")
	clientOpts := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.TODO(), clientOpts)
	Expect(err).ToNot(HaveOccurred())
	err = client.Database("kubevela").Drop(context.TODO())
	Expect(err).ToNot(HaveOccurred())

	mongodbDriver, err = New(context.TODO(), datastore.Config{
		URL:      "mongodb://localhost:27017",
		Database: "kubevela",
	})
	Expect(err).ToNot(HaveOccurred())
	Expect(mongodbDriver).ToNot(BeNil())

	mongodbDriver, err = New(context.TODO(), datastore.Config{
		URL:      "localhost:27017",
		Database: "kubevela",
	})
	Expect(err).ToNot(HaveOccurred())
	Expect(mongodbDriver).ToNot(BeNil())
	By("create mongodb driver success")

}, NodeTimeout(2*time.Minute))
