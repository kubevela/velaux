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

package model

const (
	// AutoGenDesc describes the metadata in datastore that's automatically generated
	AutoGenDesc = "Automatically converted from KubeVela Application in Kubernetes."

	// AutoGenProj describes the automatically created project
	AutoGenProj = "Automatically generated by sync mechanism."

	// AutoGenEnvNamePrefix describes the common prefix for auto-generated env
	AutoGenEnvNamePrefix = "syc-"
	// AutoGenComp describes the creator of component that is auto-generated
	AutoGenComp = "syc-comp"
	// AutoGenPolicy describes the creator of policy that is auto-generated
	AutoGenPolicy = "syc-policy"
	// AutoGenRefPolicy describes the creator of policy that is auto-generated, this differs from AutoGenPolicy as the policy is referenced ones
	AutoGenRefPolicy = "syc-ref-policy"
	// AutoGenWorkflowNamePrefix describes the common prefix for auto-generated workflow
	AutoGenWorkflowNamePrefix = "syc-"
	// AutoGenTargetNamePrefix describes the common prefix for auto-generated target
	AutoGenTargetNamePrefix = "syc-"

	// LabelSyncGeneration describes the generation synced from
	LabelSyncGeneration = "ux.oam.dev/synced-generation"
	// LabelSyncRevision describes the revision name synced from
	LabelSyncRevision = "ux.oam.dev/synced-revision"
	// LabelSyncNamespace describes the namespace synced from
	LabelSyncNamespace = "ux.oam.dev/from-namespace"
	// LabelSyncProject describes the project synced from
	LabelSyncProject = "ux.oam.dev/synced-project"
)

const (

	// DefaultInitName is default object name for initialization
	DefaultInitName = "default"

	// DefaultSystemProject is project name for the system
	DefaultSystemProject = "system"

	//  DefaultSystemProjectAlias is project alias for the system
	DefaultSystemProjectAlias = "System"

	// DefaultInitNamespace is default namespace name for initialization
	DefaultInitNamespace = "default"

	// DefaultTargetDescription describes default target created
	DefaultTargetDescription = "Default target is created by velaux system automatically."
	// DefaultEnvDescription describes default env created
	DefaultEnvDescription = "Default environment is created by velaux system automatically."
	// DefaultProjectDescription describes the default project created
	DefaultProjectDescription = "Default project is created by velaux system automatically."
)
