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

package v1alpha1

import (
	"encoding/json"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// AppTemplateSpec defines the desired state of AppTemplate
type AppTemplateSpec struct {
	Patch    []EnvBasedPatch `json:"patch,omitempty"`
	Template AppTemplateType `json:"template"`
}

type AppTemplateType struct {
	Components json.RawMessage `json:"components"`
}

type EnvBasedPatch struct {
	Envs []string `json:"envs,omitempty"`

	// Kustomize style overlay-patch on Application components.
	Components json.RawMessage `json:"components,omitempty"`

	// Go-template style parameters input on Components template.
	Parameters map[string]string `json:"parameters,omitempty"`
}

// AppTemplateStatus defines the observed state of AppTemplate
type AppTemplateStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true

// AppTemplate is the Schema for the apptemplates API
type AppTemplate struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AppTemplateSpec   `json:"spec,omitempty"`
	Status AppTemplateStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// AppTemplateList contains a list of AppTemplate
type AppTemplateList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AppTemplate `json:"items"`
}

func init() {
	SchemeBuilder.Register(&AppTemplate{}, &AppTemplateList{})
}
