/*
Copyright 2022 The KubeVela Authors.

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

package event

import (
	"context"

	"k8s.io/client-go/util/workqueue"

	"github.com/kubevela/velaux/pkg/server/event/collect"
	"github.com/kubevela/velaux/pkg/server/event/sync"
	v1beta1 "github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
)

var workers []Worker

// Worker handle events through rotation training, listener and crontab.
type Worker interface {
	Start(ctx context.Context, errChan chan error)
}

// InitEvent init all event worker
func InitEvent() []interface{} {
	application := &sync.ApplicationSync{
		Queue: workqueue.NewTypedRateLimitingQueue(workqueue.DefaultTypedControllerRateLimiter[*v1beta1.Application]()),
	}
	collect := &collect.InfoCalculateCronJob{}
	workers = append(workers, application, collect)
	return []interface{}{application, collect}
}

// StartEventWorker start all event worker
func StartEventWorker(ctx context.Context, errChan chan error) {
	for i := range workers {
		go workers[i].Start(ctx, errChan)
	}
}
