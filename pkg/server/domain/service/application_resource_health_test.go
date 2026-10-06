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

package service

import (
	"context"
	"errors"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func object(t *testing.T, apiVersion, kind string, body map[string]interface{}) *unstructured.Unstructured {
	t.Helper()
	obj := &unstructured.Unstructured{Object: body}
	obj.SetAPIVersion(apiVersion)
	obj.SetKind(kind)
	obj.SetName("x")
	obj.SetNamespace("ns")
	return obj
}

func TestKStatusHealth(t *testing.T) {
	cases := []struct {
		name string
		obj  map[string]interface{}
		kind string
		api  string
		want string
	}{
		{
			name: "a rolled-out Deployment is healthy",
			api:  "apps/v1", kind: "Deployment",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"generation": int64(2)},
				"spec":     map[string]interface{}{"replicas": int64(2)},
				"status": map[string]interface{}{
					"observedGeneration": int64(2), "replicas": int64(2), "updatedReplicas": int64(2),
					"readyReplicas": int64(2), "availableReplicas": int64(2),
					"conditions": []interface{}{
						map[string]interface{}{"type": "Available", "status": "True"},
						map[string]interface{}{"type": "Progressing", "status": "True", "reason": "NewReplicaSetAvailable"},
					},
				},
			},
			want: "Healthy",
		},
		{
			name: "a Deployment still rolling out is progressing",
			api:  "apps/v1", kind: "Deployment",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"generation": int64(2)},
				"spec":     map[string]interface{}{"replicas": int64(3)},
				"status": map[string]interface{}{
					"observedGeneration": int64(2), "replicas": int64(3), "updatedReplicas": int64(1),
					"readyReplicas": int64(1), "availableReplicas": int64(1),
				},
			},
			want: "Progressing",
		},
		{
			name: "a Deployment past its progress deadline is unhealthy",
			api:  "apps/v1", kind: "Deployment",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"generation": int64(1)},
				"spec":     map[string]interface{}{"replicas": int64(1)},
				"status": map[string]interface{}{
					"observedGeneration": int64(1), "replicas": int64(1),
					"conditions": []interface{}{
						map[string]interface{}{"type": "Progressing", "status": "False", "reason": "ProgressDeadlineExceeded"},
					},
				},
			},
			want: "UnHealthy",
		},
		{
			name: "a failed Job is unhealthy",
			api:  "batch/v1", kind: "Job",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"generation": int64(1)},
				"status": map[string]interface{}{
					"failed": int64(1),
					"conditions": []interface{}{
						map[string]interface{}{"type": "Failed", "status": "True", "message": "BackoffLimitExceeded"},
					},
				},
			},
			want: "UnHealthy",
		},
		{
			name: "a custom resource whose Ready is False is progressing",
			api:  "example.com/v1", kind: "Widget",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"generation": int64(1)},
				"status": map[string]interface{}{
					"observedGeneration": int64(1),
					"conditions": []interface{}{
						map[string]interface{}{"type": "Ready", "status": "False", "message": "waiting"},
					},
				},
			},
			want: "Progressing",
		},
		{
			name: "a custom resource Stalled is unhealthy",
			api:  "example.com/v1", kind: "Widget",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"generation": int64(1)},
				"status": map[string]interface{}{
					"observedGeneration": int64(1),
					"conditions": []interface{}{
						map[string]interface{}{"type": "Stalled", "status": "True", "message": "bad spec"},
					},
				},
			},
			want: "UnHealthy",
		},
		{
			name: "a resource being deleted is progressing",
			api:  "v1", kind: "ConfigMap",
			obj: map[string]interface{}{
				"metadata": map[string]interface{}{"deletionTimestamp": "2026-10-03T00:00:00Z"},
			},
			want: "Progressing",
		},
		{
			name: "a resource with no status to read is healthy",
			api:  "v1", kind: "ConfigMap",
			obj:  map[string]interface{}{"metadata": map[string]interface{}{}},
			want: "Healthy",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := kstatusHealth(object(t, c.api, c.kind, c.obj))
			if got["statusCode"] != c.want {
				t.Fatalf("statusCode = %v, want %s (%v)", got["statusCode"], c.want, got)
			}
			if got["source"] != "kstatus" {
				t.Fatalf("source = %v, want kstatus", got["source"])
			}
		})
	}
}

func TestApplyKStatus(t *testing.T) {
	tree := func() map[string]interface{} {
		return map[string]interface{}{
			"resources": []interface{}{
				map[string]interface{}{
					"resourceTree": map[string]interface{}{
						"apiVersion": "apps/v1", "kind": "Deployment", "name": "web", "namespace": "ns", "cluster": "local",
						"healthStatus": map[string]interface{}{"statusCode": "Healthy"},
						"leafNodes": []interface{}{
							map[string]interface{}{
								"apiVersion": "apps/v1", "kind": "ReplicaSet", "name": "web-1", "namespace": "ns",
								"healthStatus": map[string]interface{}{"statusCode": "Healthy"},
							},
						},
					},
				},
			},
		}
	}
	rollingOut := func(_ context.Context, cluster string, obj *unstructured.Unstructured) error {
		if obj.GetKind() != "Deployment" || cluster != "local" {
			return errors.New("unexpected read")
		}
		obj.Object["metadata"] = map[string]interface{}{"name": "web", "namespace": "ns", "generation": int64(2)}
		obj.Object["spec"] = map[string]interface{}{"replicas": int64(2)}
		obj.Object["status"] = map[string]interface{}{"observedGeneration": int64(1)}
		return nil
	}

	t.Run("replaces the blanket healthy of a kind KubeVela has no check for", func(t *testing.T) {
		resp := tree()
		applyKStatus(context.Background(), resp, rollingOut)
		root := resp["resources"].([]interface{})[0].(map[string]interface{})["resourceTree"].(map[string]interface{})
		if code := root["healthStatus"].(map[string]interface{})["statusCode"]; code != "Progressing" {
			t.Fatalf("Deployment statusCode = %v, want Progressing", code)
		}
	})

	t.Run("keeps KubeVela's own check where it has one, and never reads that object", func(t *testing.T) {
		resp := tree()
		applyKStatus(context.Background(), resp, rollingOut)
		root := resp["resources"].([]interface{})[0].(map[string]interface{})["resourceTree"].(map[string]interface{})
		leaf := root["leafNodes"].([]interface{})[0].(map[string]interface{})
		if code := leaf["healthStatus"].(map[string]interface{})["statusCode"]; code != "Healthy" {
			t.Fatalf("ReplicaSet statusCode = %v, want KubeVela's Healthy", code)
		}
	})

	t.Run("leaves a node as it was when its object cannot be read", func(t *testing.T) {
		resp := tree()
		applyKStatus(context.Background(), resp, func(context.Context, string, *unstructured.Unstructured) error {
			return errors.New("forbidden")
		})
		root := resp["resources"].([]interface{})[0].(map[string]interface{})["resourceTree"].(map[string]interface{})
		if code := root["healthStatus"].(map[string]interface{})["statusCode"]; code != "Healthy" {
			t.Fatalf("statusCode = %v, want it untouched", code)
		}
	})
}
