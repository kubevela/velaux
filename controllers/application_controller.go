/*


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

package controllers

import (
	"context"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	velacptypes "github.com/oam-dev/velacp/api/v1alpha1"
)

// ApplicationReconciler reconciles a Application object
type ApplicationReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=velacp.oam.dev.velacp.oam.dev,resources=applications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=velacp.oam.dev.velacp.oam.dev,resources=applications/status,verbs=get;update;patch

func (r *ApplicationReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	_ = r.Log.WithValues("application", req.NamespacedName)

	app := &velacptypes.Application{}
	err := r.Client.Get(ctx, client.ObjectKey{
		Name:      req.Name,
		Namespace: req.Namespace,
	}, app)
	if err != nil {
		return ctrl.Result{}, err
	}

	// get env
	env := &velacptypes.Environment{}
	err = r.Client.Get(ctx, client.ObjectKey{
		Name:      app.Spec.Env,
		Namespace: req.Namespace,
	}, env)
	if err != nil {
		return ctrl.Result{}, err
	}

	// patch config

	// get cluster; if empty then use self cluster

	// deploy app

	return ctrl.Result{}, nil
}

func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&velacptypes.Application{}).
		Complete(r)
}
