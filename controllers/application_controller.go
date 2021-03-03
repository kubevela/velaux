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
	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev/v1alpha2"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	velacptypes "github.com/oam-dev/velacp/api/v1alpha1"
	"github.com/oam-dev/velacp/pkg/clustermanager"
	"github.com/oam-dev/velacp/pkg/util"
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

	// get app
	app := &velacptypes.Application{}
	err := r.Client.Get(ctx, client.ObjectKey{
		Name:      req.Name,
		Namespace: req.Namespace,
	}, app)
	if err != nil {
		if apierrors.IsNotFound(err) {
			// stop processing this resource
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}
	if app.DeletionTimestamp != nil {
		// ignore deleting resource
		return ctrl.Result{}, nil
	}

	// If template name is specified, use the config from the app template
	if app.Spec.Template != "" {
		// get template
		apptmpl := &velacptypes.AppTemplate{}
		err = r.Client.Get(ctx, client.ObjectKey{
			Name:      app.Spec.Template,
			Namespace: req.Namespace,
		}, apptmpl)
		if err != nil {
			return ctrl.Result{}, err
		}

		// patch config
		components := apptmpl.Spec.Template.Components
		for _, p := range apptmpl.Spec.Patch {
			contains := false
			for _, e := range p.Envs {
				if e == app.Spec.Env {
					contains = true
					break
				}
			}
			components, err = util.PatchComponents(apptmpl.Spec.Template.Components, p.Components)
			if err != nil {
				return ctrl.Result{}, err
			}
			if contains {
				break
			}
		}
		app.Spec.Components = components
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

	// get cluster
	for _, ref := range env.Spec.Clusters {
		cluster := &velacptypes.Cluster{}
		err = r.Client.Get(ctx, client.ObjectKey{
			Name:      ref.Name,
			Namespace: req.Namespace,
		}, cluster)
		if err != nil {
			return ctrl.Result{}, err
		}

		clientForTarget, err := clustermanager.GetClient([]byte(cluster.Spec.Kubeconfig))
		if err != nil {
			return ctrl.Result{}, err
		}

		err = deployApp(ctx, clientForTarget, app)
		if err != nil {
			return ctrl.Result{}, err
		}

	}

	return ctrl.Result{}, nil
}

func deployApp(ctx context.Context, clientForTarget client.Client, app *velacptypes.Application) error {
	err := clientForTarget.Get(ctx, client.ObjectKey{
		Name:      app.Name,
		Namespace: app.Namespace,
	}, &oamcore.Application{})
	switch {
	case err == nil:
		return clientForTarget.Update(ctx, makeOAMApp(app))
	case apierrors.IsNotFound(err):
		return clientForTarget.Create(ctx, makeOAMApp(app))
	default:
		return err
	}
	return nil
}

func makeOAMApp(app *velacptypes.Application) *oamcore.Application {
	res := &oamcore.Application{}
	res.Name = app.Name
	res.Namespace = app.Namespace
	res.OwnerReferences = append(res.OwnerReferences,
		*metav1.NewControllerRef(app, velacptypes.GroupVersion.WithKind("Application")))
	res.Spec.Components = app.Spec.Components

	return res
}

func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&velacptypes.Application{}).
		Complete(r)
}
