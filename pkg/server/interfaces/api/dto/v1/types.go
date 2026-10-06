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

package v1

import (
	"encoding/json"
	"time"

	"github.com/kubevela/velaux/pkg/cloudprovider"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/getkin/kin-openapi/openapi3"
	registryv1 "github.com/google/go-containerregistry/pkg/v1"
	wfTypesv1alpha1 "github.com/kubevela/pkg/apis/oam/v1alpha1"
	workflowv1alpha1 "github.com/kubevela/workflow/api/v1alpha1"
	"helm.sh/helm/v3/pkg/repo"
	corev1 "k8s.io/api/core/v1"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/common"
	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	"github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/addon"
	"github.com/oam-dev/kubevela/pkg/config"
	velacommon "github.com/oam-dev/kubevela/pkg/utils/common"
	"github.com/oam-dev/kubevela/pkg/utils/schema"

	pluginTypes "github.com/kubevela/velaux/pkg/plugin/types"
	"github.com/kubevela/velaux/pkg/server/domain/model"
)

var (
	// CtxKeyApplication request context key of application
	CtxKeyApplication = "application"
	// CtxKeyWorkflow request context key of the workflow
	CtxKeyWorkflow = "workflow"
	// CtxKeyWorkflowRecord request context key of the workflow record
	CtxKeyWorkflowRecord = "workflow-record"
	// CtxKeyTarget request context key of workflow
	CtxKeyTarget = "delivery-target"
	// CtxKeyApplicationEnvBinding request context key of env binding
	CtxKeyApplicationEnvBinding = "envbinding-policy"
	// CtxKeyApplicationComponent request context key of component
	CtxKeyApplicationComponent = "component"
	// CtxKeyUser request context key of user
	CtxKeyUser = "user"
	// CtxKeyUserModel request context key of user model
	CtxKeyUserModel = "user-model"
	// CtxKeyProject request context key of project
	CtxKeyProject = "project"
	// CtxKeyToken request context key of request token
	CtxKeyToken = "token"
	// CtxKeyPipeline request context key of pipeline
	CtxKeyPipeline = "pipeline"
	// CtxKeyPipelineContext request context key of pipeline context
	CtxKeyPipelineContext = "pipeline-context"
	// CtxKeyPipelineRun request context key of pipeline run
	CtxKeyPipelineRun = "pipeline-run"
)

// AddonPhase defines the phase of an addon
type AddonPhase string

const (
	// AddonPhaseDisabled indicates the addon is disabled
	AddonPhaseDisabled AddonPhase = "disabled"
	// AddonPhaseEnabled indicates the addon is enabled
	AddonPhaseEnabled AddonPhase = "enabled"
	// AddonPhaseEnabling indicates the addon is enabling
	AddonPhaseEnabling AddonPhase = "enabling"
	// AddonPhaseDisabling indicates the addon is enabling
	AddonPhaseDisabling AddonPhase = "disabling"
	// AddonPhaseSuspend indicates the addon is suspend
	AddonPhaseSuspend AddonPhase = "suspend"
)

// EmptyResponse empty response, it will used for delete api
type EmptyResponse struct{}

// NameAlias name and alias
type NameAlias struct {
	Name  string `json:"name"`
	Alias string `json:"alias"`
}

// CreateAddonRegistryRequest defines the format for addon registry create request
type CreateAddonRegistryRequest struct {
	Name   string                   `json:"name" validate:"checkname"`
	Helm   *addon.HelmSource        `json:"helm,omitempty"`
	Git    *addon.GitAddonSource    `json:"git,omitempty" `
	Oss    *addon.OSSAddonSource    `json:"oss,omitempty"`
	Gitee  *addon.GiteeAddonSource  `json:"gitee,omitempty" `
	Gitlab *addon.GitlabAddonSource `json:"gitlab,omitempty" `
}

// UpdateAddonRegistryRequest defines the format for addon registry update request
type UpdateAddonRegistryRequest struct {
	Helm   *addon.HelmSource        `json:"helm,omitempty"`
	Git    *addon.GitAddonSource    `json:"git,omitempty"`
	Oss    *addon.OSSAddonSource    `json:"oss,omitempty"`
	Gitee  *addon.GiteeAddonSource  `json:"gitee,omitempty" `
	Gitlab *addon.GitlabAddonSource `json:"gitlab,omitempty" `
}

// AddonRegistry defines the format for a single addon registry
type AddonRegistry struct {
	Name   string                   `json:"name" validate:"required"`
	Helm   *addon.HelmSource        `json:"helm,omitempty"`
	Git    *addon.GitAddonSource    `json:"git,omitempty"`
	OSS    *addon.OSSAddonSource    `json:"oss,omitempty"`
	Gitee  *addon.GiteeAddonSource  `json:"gitee,omitempty" `
	Gitlab *addon.GitlabAddonSource `json:"gitlab,omitempty" `
}

// ListAddonRegistryResponse list addon registry
type ListAddonRegistryResponse struct {
	Registries []*AddonRegistry `json:"registries"`
}

// EnableAddonRequest defines the format for enable addon request
type EnableAddonRequest struct {
	// Args is the key-value environment variables, e.g. AK/SK credentials.
	Args map[string]interface{} `json:"args,omitempty"`
	// Clusters specify the clusters this addon should be installed, if not specified, it will follow the configure in addon metadata.yaml
	Clusters []string `json:"clusters,omitempty"`
	// Version specify the version of addon to enable
	Version string `json:"version,omitempty"`
	// RegistryName specify the registry name
	RegistryName string `json:"registryName,omitempty"`
}

// ListAddonResponse defines the format for addon list response
type ListAddonResponse struct {
	Addons []*AddonInfo `json:"addons"`

	// Message demonstrate the error info if exists
	Message string `json:"message,omitempty"`
}

// AddonInfo contain addon metaData and some baseInfo
type AddonInfo struct {
	*addon.Meta
	RegistryName string `json:"registryName"`
}

// ListEnabledAddonResponse defines the format for enabled addon list response
type ListEnabledAddonResponse struct {
	EnabledAddons []*AddonBaseStatus `json:"enabledAddons"`
}

// AddonBaseStatus addon base status
type AddonBaseStatus struct {
	Name  string     `json:"name"`
	Phase AddonPhase `json:"phase"`
	// ManagedBy is the Application whose addon component installed the addon;
	// the addon is enabled, upgraded and disabled there, not here.
	ManagedBy *AddonManager `json:"managedBy,omitempty"`
}

// AddonManager names the Application that manages an addon
type AddonManager struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

// DetailAddonResponse defines the format for showing the addon details
type DetailAddonResponse struct {
	addon.Meta

	APISchema *openapi3.Schema `json:"schema"`
	UISchema  schema.UISchema  `json:"uiSchema"`

	// More details about the addon, e.g. README
	Detail            string             `json:"detail,omitempty"`
	Definitions       []*AddonDefinition `json:"definitions"`
	RegistryName      string             `json:"registryName,omitempty"`
	AvailableVersions []string           `json:"availableVersions"`
}

// AddonDefinition is definition an addon can provide
type AddonDefinition struct {
	Name string `json:"name,omitempty"`
	// can be component/trait...definition
	DefType     string `json:"type,omitempty"`
	Description string `json:"description,omitempty"`
}

// AddonStatusResponse defines the format of addon status response
type AddonStatusResponse struct {
	AddonBaseStatus
	Args             map[string]interface{} `json:"args"`
	EnablingProgress *EnablingProgress      `json:"enabling_progress,omitempty"`
	AppStatus        common.AppStatus       `json:"appStatus,omitempty"`
	InstalledVersion string                 `json:"installedVersion,omitempty"`

	// the status of multiple clusters
	Clusters    map[string]map[string]interface{} `json:"clusters,omitempty"`
	AllClusters []NameAlias                       `json:"allClusters,omitempty"`
}

// EnablingProgress defines the progress of enabling an addon
type EnablingProgress struct {
	EnabledComponents int `json:"enabled_components"`
	TotalComponents   int `json:"total_components"`
}

// AddonArgsResponse defines the response of addon args
type AddonArgsResponse struct {
	Args map[string]string `json:"args"`
}

// CreateConfigRequest is the request body to creates a config
type CreateConfigRequest struct {
	Name        string         `json:"name" validate:"checkname"`
	Alias       string         `json:"alias"`
	Description string         `json:"description"`
	Template    NamespacedName `json:"template"`
	Properties  string         `json:"properties,omitempty"`
}

// UpdateConfigRequest is the request body to update a config
type UpdateConfigRequest struct {
	Alias       string `json:"alias"`
	Description string `json:"description"`
	Properties  string `json:"properties,omitempty"`
}

// ConfigTemplate define the format for listing configuration types
type ConfigTemplate struct {
	Alias       string    `json:"alias"`
	Name        string    `json:"name"`
	Namespace   string    `json:"namespace"`
	Description string    `json:"description"`
	Scope       string    `json:"scope"`
	Sensitive   bool      `json:"sensitive"`
	CreateTime  time.Time `json:"createTime"`
	// Legacy marks a template kept as a config-template ConfigMap rather than a
	// ConfigTemplate.
	Legacy bool `json:"legacy,omitempty"`
}

// ConfigTemplateDetail define the format for detail the config template
type ConfigTemplateDetail struct {
	ConfigTemplate
	APISchema *openapi3.Schema `json:"schema"`
	UISchema  schema.UISchema  `json:"uiSchema"`
	// OutputSchema is a source definition's `schema`: the value an
	// Application reads with $(source.<name>).
	OutputSchema *openapi3.Schema `json:"outputSchema,omitempty"`
}

// Config define the metadata of a config
type Config struct {
	Template    config.NamespacedName         `json:"template"`
	Name        string                        `json:"name"`
	Namespace   string                        `json:"namespace"`
	Sensitive   bool                          `json:"sensitive"`
	Project     string                        `json:"project"`
	Alias       string                        `json:"alias"`
	Description string                        `json:"description"`
	CreatedTime *time.Time                    `json:"createdTime"`
	Properties  map[string]interface{}        `json:"properties,omitempty"`
	Shared      bool                          `json:"shared"`
	Secret      *corev1.Secret                `json:"-"`
	Targets     []*config.ClusterTargetStatus `json:"targets"`
	// Legacy marks a config kept as a Secret VelaUX writes rather than a Config
	// the controller renders.
	Legacy bool `json:"legacy,omitempty"`
	// Phase and Message are a Config's status: Available once rendered, or the
	// reason it could not be.
	Phase   string `json:"phase,omitempty"`
	Message string `json:"message,omitempty"`
}

// ListConfigResponse is the response body for listing the configs
type ListConfigResponse struct {
	Configs []*Config `json:"configs"`
}

// ListConfigTemplateResponse is the response body for listing the config templates
type ListConfigTemplateResponse struct {
	Templates []*ConfigTemplate `json:"templates"`
}

// ImageResponse is the response for checking image
type ImageResponse struct {
	Existed bool   `json:"existed"`
	Secret  string `json:"secret"`
}

// AccessKeyRequest request parameters to access cloud provider
type AccessKeyRequest struct {
	AccessKeyID     string `json:"accessKeyID"`
	AccessKeySecret string `json:"accessKeySecret"`
}

// CreateClusterRequest request parameters to create a cluster
type CreateClusterRequest struct {
	Name             string            `json:"name" validate:"checkname"`
	Alias            string            `json:"alias" validate:"checkalias" optional:"true"`
	Description      string            `json:"description,omitempty"`
	Icon             string            `json:"icon"`
	KubeConfig       string            `json:"kubeConfig,omitempty" validate:"required_without=KubeConfigSecret"`
	KubeConfigSecret string            `json:"kubeConfigSecret,omitempty" validate:"required_without=KubeConfig"`
	Labels           map[string]string `json:"labels,omitempty"`
	DashboardURL     string            `json:"dashboardURL,omitempty"`
}

// ConnectCloudClusterRequest request parameters to create a cluster from cloud cluster
type ConnectCloudClusterRequest struct {
	AccessKeyID     string            `json:"accessKeyID"`
	AccessKeySecret string            `json:"accessKeySecret"`
	ClusterID       string            `json:"clusterID"`
	Name            string            `json:"name" validate:"checkname"`
	Alias           string            `json:"alias" optional:"true" validate:"checkalias"`
	Description     string            `json:"description,omitempty" optional:"true"`
	Icon            string            `json:"icon"`
	Labels          map[string]string `json:"labels,omitempty"`
}

// CreateCloudClusterRequest request parameters to create a cloud cluster (buy one)
type CreateCloudClusterRequest struct {
	AccessKeyID       string `json:"accessKeyID"`
	AccessKeySecret   string `json:"accessKeySecret"`
	Name              string `json:"name" validate:"checkname"`
	Zone              string `json:"zone"`
	WorkerNumber      int    `json:"workerNumber"`
	CPUCoresPerWorker int64  `json:"cpuCoresPerWorker"`
	MemoryPerWorker   int64  `json:"memoryPerWorker"`
}

// ClusterResourceInfo resource info of cluster
type ClusterResourceInfo struct {
	WorkerNumber     int      `json:"workerNumber"`
	MasterNumber     int      `json:"masterNumber"`
	MemoryCapacity   int64    `json:"memoryCapacity"`
	CPUCapacity      int64    `json:"cpuCapacity"`
	GPUCapacity      int64    `json:"gpuCapacity,omitempty"`
	PodCapacity      int64    `json:"podCapacity"`
	MemoryUsed       int64    `json:"memoryUsed"`
	CPUUsed          int64    `json:"cpuUsed"`
	GPUUsed          int64    `json:"gpuUsed,omitempty"`
	PodUsed          int64    `json:"podUsed"`
	StorageClassList []string `json:"storageClassList,omitempty"`
}

// CreateClusterNamespaceRequest request parameter to create namespace in cluster
type CreateClusterNamespaceRequest struct {
	Namespace string `json:"namespace"`
}

// CreateClusterNamespaceResponse response parameter for created namespace in cluster
type CreateClusterNamespaceResponse struct {
	Exists bool `json:"exists"`
}

// DetailClusterResponse cluster detail information model
type DetailClusterResponse struct {
	model.Cluster
	ResourceInfo ClusterResourceInfo `json:"resourceInfo"`
}

// ListClusterResponse list cluster
type ListClusterResponse struct {
	Clusters []ClusterBase `json:"clusters"`
	Total    int64         `json:"total"`
}

// ListCloudClusterResponse list cloud clusters
type ListCloudClusterResponse struct {
	Clusters []cloudprovider.CloudCluster `json:"clusters"`
	Total    int                          `json:"total"`
}

// CreateCloudClusterResponse return values for cloud cluster create request
type CreateCloudClusterResponse struct {
	Name      string `json:"clusterName"`
	ClusterID string `json:"clusterID"`
	Status    string `json:"status"`
}

// ListCloudClusterCreationResponse return the cluster names of creation process of cloud clusters
type ListCloudClusterCreationResponse struct {
	Creations []CreateCloudClusterResponse `json:"creations"`
}

// ClusterBase cluster base model
type ClusterBase struct {
	Name        string            `json:"name"`
	Alias       string            `json:"alias" optional:"true" validate:"checkalias"`
	Description string            `json:"description" optional:"true"`
	Icon        string            `json:"icon" optional:"true"`
	Labels      map[string]string `json:"labels" optional:"true"`

	Provider     model.ProviderInfo `json:"providerInfo"`
	APIServerURL string             `json:"apiServerURL"`
	DashboardURL string             `json:"dashboardURL"`

	Status string `json:"status"`
	Reason string `json:"reason"`
}

// ListApplicationOptions list application  query options
type ListApplicationOptions struct {
	Projects   []string          `json:"projects"`
	Env        string            `json:"env"`
	TargetName string            `json:"targetName"`
	Query      string            `json:"query"`
	Labels     map[string]string `json:"labels"`
	// WithStatus fills each application's status summary from its envs.
	WithStatus bool `json:"withStatus"`
	// Addons is exclude, to leave out the applications addons install, or only,
	// for those alone; every application otherwise.
	Addons string `json:"addons,omitempty"`
}

// ListApplicationResponse list applications by query params
type ListApplicationResponse struct {
	Applications []*ApplicationBase `json:"applications"`
}

// EnvBindingList env binding list
type EnvBindingList []*EnvBinding

// ApplicationBase application base model
type ApplicationBase struct {
	Name        string            `json:"name"`
	Alias       string            `json:"alias"`
	Project     *ProjectBase      `json:"project"`
	Description string            `json:"description"`
	CreateTime  time.Time         `json:"createTime"`
	UpdateTime  time.Time         `json:"updateTime"`
	Icon        string            `json:"icon"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
	ReadOnly    bool              `json:"readOnly,omitempty"`
	// Status summarises the application across its envs, when listed with status.
	Status *ApplicationStatusSummary `json:"status,omitempty"`
}

// The health of an application, worst first.
const (
	AppHealthFailed      = "failed"
	AppHealthUnhealthy   = "unhealthy"
	AppHealthSuspended   = "suspended"
	AppHealthProgressing = "progressing"
	AppHealthHealthy     = "healthy"
	AppHealthUndeployed  = "undeployed"
)

// ApplicationStatusSummary is an application's health at a glance: the worst
// of its envs, and its components counted across them.
type ApplicationStatusSummary struct {
	Health string `json:"health"`
	// Workflow is the workflow phase of the env setting the health.
	Workflow string `json:"workflow,omitempty"`
	// Components counts each component once per place it runs.
	Components        int                 `json:"components"`
	HealthyComponents int                 `json:"healthyComponents"`
	Envs              []*EnvStatusSummary `json:"envs,omitempty"`
}

// EnvStatusSummary is an application's health in one env.
type EnvStatusSummary struct {
	Env               string `json:"env"`
	Health            string `json:"health"`
	Phase             string `json:"phase"`
	Workflow          string `json:"workflow,omitempty"`
	Components        int    `json:"components"`
	HealthyComponents int    `json:"healthyComponents"`
}

// AppCompareResponse application compare result
type AppCompareResponse struct {
	IsDiff bool `json:"isDiff"`
	// Error says why the two could not be compared; IsDiff is then false
	// because nothing is known, not because nothing differs.
	Error         string `json:"error,omitempty"`
	DiffReport    string `json:"diffReport"`
	BaseAppYAML   string `json:"baseAppYAML"`
	TargetAppYAML string `json:"targetAppYAML"`
}

// AppResetResponse application reset result
type AppResetResponse struct {
	IsReset bool `json:"isReset"`
}

// AppCompareReq  application compare req
type AppCompareReq struct {
	CompareRevisionWithRunning *CompareRevisionWithRunningOption `json:"compareRevisionWithRunning,omitempty"`
	CompareRevisionWithLatest  *CompareRevisionWithLatestOption  `json:"compareRevisionWithLatest,omitempty"`
	CompareLatestWithRunning   *CompareLatestWithRunningOption   `json:"compareLatestWithRunning,omitempty"`
}

// CompareRevisionWithRunningOption means compare the specified version with the application in cluster.
type CompareRevisionWithRunningOption struct {
	// Revision, If not specified, means use the latest revision.
	Revision string `json:"revision" optional:"true"`
}

// CompareRevisionWithLatestOption means compare the the specified version with the latest application configuration
type CompareRevisionWithLatestOption struct {
	// Revision, If not specified, means use the latest revision.
	Revision string `json:"revision" optional:"true"`
}

// CompareLatestWithRunningOption means compare the latest configuration with the app in cluster.
type CompareLatestWithRunningOption struct {
	Env string `json:"env" validate:"required"`
}

// AppDryRunReq application dry-run req
type AppDryRunReq struct {
	DryRunType string `json:"dryRunType" validate:"oneof=APP REVISION"`
	Env        string `json:"env"`
	Workflow   string `json:"workflow"`
	Version    string `json:"version"`
}

// AppDryRunResponse application dry-run result
type AppDryRunResponse struct {
	YAML    string `json:"yaml"`
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

// ApplicationStatusResponse application env status response body
type ApplicationStatusResponse struct {
	EnvName string             `json:"envName"`
	Status  *ApplicationStatus `json:"status"`
}

// ApplicationStatus is an Application's status as KubeVela reports it. Fields
// the KubeVela types VelaUX builds against do not carry yet sit beside them.
type ApplicationStatus struct {
	common.AppStatus `json:",inline"`
	// Dependencies is what each component depends on: the components named in
	// its dependsOn, those whose outputs its inputs read, and those its property
	// expressions read.
	Dependencies []ComponentDependency `json:"dependencies,omitempty"`
	// Paused is whether the controller skips the Application: it carries the
	// controller.core.oam.dev/pause label.
	Paused bool `json:"paused,omitempty"`
	// ReconcileInterval is the Application's own resync period, where it sets one.
	ReconcileInterval string `json:"reconcileInterval,omitempty"`
	// RestartWorkflow is a pending or recurring workflow restart: "true", a time
	// or an interval. status.workflowRestartScheduledAt is when it next runs.
	RestartWorkflow string `json:"restartWorkflow,omitempty"`
	// AutoUpdate is whether the Application follows definition changes. KubeVela
	// refuses it beside the publishVersion every VelaUX deploy sets.
	AutoUpdate bool `json:"autoUpdate,omitempty"`
}

// ReconcileIntervalRequest sets an Application's resync period; empty clears it.
type ReconcileIntervalRequest struct {
	Interval string `json:"interval"`
}

// RestartWorkflowRequest restarts an Application's workflow: now when empty, at
// an RFC3339 time, or after every completion when an interval.
type RestartWorkflowRequest struct {
	Schedule string `json:"schedule"`
}

// ComponentDependency is one component another depends on, as the
// Application's status.dependencies reports it. Source is where it is declared:
// dependsOn, inputs or expression. Cluster and Namespace are set when an
// expression reads the component at a placement it names.
type ComponentDependency struct {
	Component string `json:"component"`
	DependsOn string `json:"dependsOn"`
	Source    string `json:"source"`
	Cluster   string `json:"cluster,omitempty"`
	Namespace string `json:"namespace,omitempty"`
}

// ApplicationStatusListResponse the all env status of an application
type ApplicationStatusListResponse struct {
	Status []*ApplicationStatusResponse `json:"status"`
}

// ApplicationStatisticsResponse application statistics response body
type ApplicationStatisticsResponse struct {
	EnvCount      int64 `json:"envCount"`
	TargetCount   int64 `json:"targetCount"`
	RevisionCount int64 `json:"revisionCount"`
	WorkflowCount int64 `json:"workflowCount"`
}

// CreateApplicationRequest create application request body
type CreateApplicationRequest struct {
	Name        string            `json:"name" validate:"checkname"`
	Alias       string            `json:"alias" validate:"checkalias" optional:"true"`
	Project     string            `json:"project" validate:"checkname"`
	Description string            `json:"description" optional:"true"`
	Icon        string            `json:"icon"`
	Labels      map[string]string `json:"labels,omitempty"`
	// Annotations are set on the application as created, such as
	// app.oam.dev/cel-expressions to have it read $( ) expressions.
	Annotations map[string]string       `json:"annotations,omitempty"`
	EnvBinding  []*EnvBinding           `json:"envBinding,omitempty"`
	Component   *CreateComponentRequest `json:"component"`
	// WorkflowMode is StepByStep or DAG for the workflows created for EnvBinding;
	// KubeVela's default when empty.
	WorkflowMode string `json:"workflowMode,omitempty"`
}

// UpdateApplicationRequest update application base config
type UpdateApplicationRequest struct {
	Alias       string            `json:"alias" validate:"checkalias" optional:"true"`
	Description string            `json:"description" optional:"true"`
	Icon        string            `json:"icon" optional:"true"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
}

// CreateApplicationTriggerRequest create application trigger
type CreateApplicationTriggerRequest struct {
	Name          string `json:"name" validate:"checkname"`
	Alias         string `json:"alias" validate:"checkalias" optional:"true"`
	Description   string `json:"description" optional:"true"`
	WorkflowName  string `json:"workflowName"`
	Type          string `json:"type" validate:"oneof=webhook"`
	PayloadType   string `json:"payloadType" validate:"checkpayloadtype"`
	ComponentName string `json:"componentName,omitempty" optional:"true"`
	Registry      string `json:"registry,omitempty" optional:"true"`
}

// UpdateApplicationTriggerRequest update application trigger
type UpdateApplicationTriggerRequest struct {
	Alias         string `json:"alias" validate:"checkalias" optional:"true"`
	Description   string `json:"description" optional:"true"`
	WorkflowName  string `json:"workflowName"`
	PayloadType   string `json:"payloadType" validate:"checkpayloadtype"`
	ComponentName string `json:"componentName,omitempty" optional:"true"`
	Registry      string `json:"registry,omitempty" optional:"true"`
}

// ApplicationTriggerBase application trigger base model
type ApplicationTriggerBase struct {
	Name          string    `json:"name"`
	Alias         string    `json:"alias,omitempty"`
	Description   string    `json:"description,omitempty"`
	WorkflowName  string    `json:"workflowName"`
	Type          string    `json:"type"`
	PayloadType   string    `json:"payloadType"`
	Token         string    `json:"token"`
	ComponentName string    `json:"componentName,omitempty"`
	Registry      string    `json:"registry"`
	CreateTime    time.Time `json:"createTime"`
	UpdateTime    time.Time `json:"updateTime"`
}

// ListApplicationTriggerResponse list application triggers response body
type ListApplicationTriggerResponse struct {
	Triggers []*ApplicationTriggerBase `json:"triggers"`
}

// HandleApplicationTriggerWebhookRequest handles application trigger webhook request
type HandleApplicationTriggerWebhookRequest struct {
	Action   string                       `json:"action,omitempty"`
	Step     string                       `json:"step,omitempty"`
	Upgrade  map[string]*model.JSONStruct `json:"upgrade,omitempty"`
	CodeInfo *model.CodeInfo              `json:"codeInfo,omitempty"`
}

// HandleApplicationTriggerACRRequest handles application trigger ACR request
type HandleApplicationTriggerACRRequest struct {
	PushData   ACRPushData   `json:"push_data"`
	Repository ACRRepository `json:"repository"`
}

// ACRPushData is the push data of ACR
type ACRPushData struct {
	Digest   string `json:"digest"`
	PushedAt string `json:"pushed_at"`
	Tag      string `json:"tag"`
}

// ACRRepository is the repository of ACR
type ACRRepository struct {
	DateCreated            string `json:"date_created"`
	Name                   string `json:"name"`
	Namespace              string `json:"namespace"`
	Region                 string `json:"region"`
	RepoAuthenticationType string `json:"repo_authentication_type"`
	RepoFullName           string `json:"repo_full_name"`
	RepoOriginType         string `json:"repo_origin_type"`
	RepoType               string `json:"repo_type"`
}

// HandleApplicationHarborReq handles application trigger harbor request
type HandleApplicationHarborReq struct {
	Type      string    `json:"type"`
	OccurAt   int64     `json:"occur_at"`
	Operator  string    `json:"operator"`
	EventData EventData `json:"event_data"`
}

// Resources is the image info of harbor
type Resources struct {
	Digest      string `json:"digest"`
	Tag         string `json:"tag"`
	ResourceURL string `json:"resource_url"`
}

// Repository is the repository of harbor
type Repository struct {
	DateCreated  int64  `json:"date_created"`
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	RepoFullName string `json:"repo_full_name"`
	RepoType     string `json:"repo_type"`
}

// EventData is the event info of harbor
type EventData struct {
	Resources  []Resources `json:"resources"`
	Repository Repository  `json:"repository"`
}

// HandleApplicationTriggerDockerHubRequest application trigger DockerHub webhook request
type HandleApplicationTriggerDockerHubRequest struct {
	CallbackURL string              `json:"callback_url"`
	PushData    DockerHubData       `json:"push_data"`
	Repository  DockerHubRepository `json:"repository"`
}

// DockerHubData is the push data of dockerhub
type DockerHubData struct {
	Images   []string `json:"images"`
	PushedAt int64    `json:"pushed_at"`
	Pusher   string   `json:"pusher"`
	Tag      string   `json:"tag"`
}

// DockerHubRepository is the repository of dockerhub
type DockerHubRepository struct {
	CommentCount    int    `json:"comment_count"`
	DateCreated     int64  `json:"date_created"`
	Description     string `json:"description"`
	Dockerfile      string `json:"dockerfile"`
	FullDescription string `json:"full_description"`
	IsOfficial      bool   `json:"is_official"`
	IsPrivate       bool   `json:"is_private"`
	IsTrusted       bool   `json:"is_trusted"`
	Name            string `json:"name"`
	Namespace       string `json:"namespace"`
	Owner           string `json:"owner"`
	RepoName        string `json:"repo_name"`
	RepoURL         string `json:"repo_url"`
	StartCount      int    `json:"star_count"`
	Status          string `json:"status"`
}

// HandleApplicationTriggerJFrogRequest application trigger JFrog webhook request
type HandleApplicationTriggerJFrogRequest struct {
	Domain    string           `json:"domain"`
	EventType string           `json:"event_type"`
	Data      JFrogWebhookData `json:"data"`
}

// JFrogWebhookData is the data of JFrog webhook request
type JFrogWebhookData struct {
	URL       string `json:"url"`
	ImageName string `json:"image_name"`
	Name      string `json:"name"`
	Path      string `json:"path"`
	RepoKey   string `json:"repo_key"`
	Digest    string `json:"sha256"`
	Tag       string `json:"tag"`
}

// EnvBinding application env binding
type EnvBinding struct {
	Name string `json:"name" validate:"checkname"`
	// TODO: support componentsPatch
}

// EnvBindingTarget the target struct in the envbinding base struct
type EnvBindingTarget struct {
	NameAlias
	Cluster *ClusterTarget `json:"cluster,omitempty"`
}

// EnvBindingBase application env binding
type EnvBindingBase struct {
	Name               string             `json:"name" validate:"checkname"`
	Alias              string             `json:"alias" validate:"checkalias" optional:"true"`
	Description        string             `json:"description,omitempty" optional:"true"`
	TargetNames        []string           `json:"targetNames"`
	Targets            []EnvBindingTarget `json:"targets,omitempty"`
	ComponentSelector  *ComponentSelector `json:"componentSelector" optional:"true"`
	CreateTime         time.Time          `json:"createTime"`
	UpdateTime         time.Time          `json:"updateTime"`
	AppDeployName      string             `json:"appDeployName"`
	AppDeployNamespace string             `json:"appDeployNamespace"`
	Workflow           NameAlias          `json:"workflow"`
}

// DetailEnvBindingResponse defines the response of env-binding details
type DetailEnvBindingResponse struct {
	EnvBindingBase
}

// ClusterSelector cluster selector
type ClusterSelector struct {
	Name string `json:"name" validate:"checkname"`
	// Adapt to a scenario where only one Namespace is available or a user-defined Namespace is available.
	Namespace string `json:"namespace,omitempty"`
}

// ComponentSelector component selector
type ComponentSelector struct {
	Components []string `json:"components"`
}

// DetailApplicationResponse application  detail
type DetailApplicationResponse struct {
	ApplicationBase
	Policies     []string                `json:"policies"`
	EnvBindings  []string                `json:"envBindings"`
	ResourceInfo ApplicationResourceInfo `json:"resourceInfo"`
}

// ApplicationResourceInfo application-level resource consumption statistics
type ApplicationResourceInfo struct {
	ComponentNum int64 `json:"componentNum"`
	// Others, such as: Memory、CPU、GPU、Storage
}

// ComponentBase component  base model
type ComponentBase struct {
	Name          string                        `json:"name"`
	Alias         string                        `json:"alias"`
	Description   string                        `json:"description"`
	Labels        map[string]string             `json:"labels,omitempty"`
	ComponentType string                        `json:"componentType"`
	Main          bool                          `json:"main"`
	Icon          string                        `json:"icon,omitempty"`
	DependsOn     []string                      `json:"dependsOn"`
	Creator       string                        `json:"creator,omitempty"`
	CreateTime    time.Time                     `json:"createTime"`
	UpdateTime    time.Time                     `json:"updateTime"`
	Inputs        wfTypesv1alpha1.StepInputs    `json:"inputs,omitempty"`
	Outputs       wfTypesv1alpha1.StepOutputs   `json:"outputs,omitempty"`
	Traits        []*ApplicationTrait           `json:"traits"`
	WorkloadType  common.WorkloadTypeDescriptor `json:"workloadType,omitempty"`
}

// ComponentListResponse list component
type ComponentListResponse struct {
	Components []*ComponentBase `json:"components"`
}

// CreateComponentRequest create component  request model
type CreateComponentRequest struct {
	Name          string                           `json:"name" validate:"checkname"`
	Alias         string                           `json:"alias" validate:"checkalias" optional:"true"`
	Description   string                           `json:"description" optional:"true"`
	Icon          string                           `json:"icon" optional:"true"`
	Labels        map[string]string                `json:"labels,omitempty"`
	ComponentType string                           `json:"componentType" validate:"checktype"`
	Properties    string                           `json:"properties,omitempty"`
	DependsOn     []string                         `json:"dependsOn" optional:"true"`
	Inputs        wfTypesv1alpha1.StepInputs       `json:"inputs,omitempty" optional:"true"`
	Outputs       wfTypesv1alpha1.StepOutputs      `json:"outputs,omitempty" optional:"true"`
	Traits        []*CreateApplicationTraitRequest `json:"traits,omitempty" optional:"true"`
}

// UpdateApplicationComponentRequest update component request body
type UpdateApplicationComponentRequest struct {
	Alias       *string            `json:"alias" optional:"true"`
	Description *string            `json:"description" optional:"true"`
	Icon        *string            `json:"icon" optional:"true"`
	Labels      *map[string]string `json:"labels,omitempty"`
	Properties  *string            `json:"properties,omitempty"`
	DependsOn   *[]string          `json:"dependsOn" optional:"true"`
}

// DetailComponentResponse detail component response body
type DetailComponentResponse struct {
	model.ApplicationComponent
	Definition v1beta1.ComponentDefinitionSpec `json:"definition"`
}

// ListApplicationComponentOptions list app  component list
type ListApplicationComponentOptions struct {
	EnvName string `json:"envName"`
}

// CreateApplicationTemplateRequest create app template request model
type CreateApplicationTemplateRequest struct {
	TemplateName string `json:"templateName" validate:"checkname"`
	Version      string `json:"version" validate:"required"`
	Description  string `json:"description"`
}

// ApplicationTemplateBase app template model
type ApplicationTemplateBase struct {
	TemplateName string                        `json:"templateName"`
	Versions     []*ApplicationTemplateVersion `json:"versions,omitempty"`
	CreateTime   time.Time                     `json:"createTime"`
	UpdateTime   time.Time                     `json:"updateTime"`
}

// ApplicationTemplateVersion template version model
type ApplicationTemplateVersion struct {
	Version     string    `json:"version"`
	Description string    `json:"description"`
	CreateUser  string    `json:"createUser"`
	CreateTime  time.Time `json:"createTime"`
	UpdateTime  time.Time `json:"updateTime"`
}

// ListProjectResponse list project response body
type ListProjectResponse struct {
	Projects []*ProjectBase `json:"projects"`
	Total    int64          `json:"total"`
}

// ProjectBase project base model
type ProjectBase struct {
	Name        string    `json:"name"`
	Alias       string    `json:"alias"`
	Description string    `json:"description"`
	CreateTime  time.Time `json:"createTime"`
	UpdateTime  time.Time `json:"updateTime"`
	Owner       NameAlias `json:"owner,omitempty"`
	Namespace   string    `json:"namespace"`
}

// CreateProjectRequest create project request body
type CreateProjectRequest struct {
	Name        string `json:"name" validate:"checkname"`
	Alias       string `json:"alias" validate:"checkalias" optional:"true"`
	Description string `json:"description" optional:"true"`
	Owner       string `json:"owner" optional:"true"`
	// the namespace to save the pipelines belong to this project.
	Namespace string `json:"namespace" optional:"true"`
}

// UpdateProjectRequest update a project request body
type UpdateProjectRequest struct {
	Alias       string `json:"alias" validate:"checkalias" optional:"true"`
	Description string `json:"description" optional:"true"`
	Owner       string `json:"owner" optional:"true"`
}

// Env models the data of env in API
type Env struct {
	Name        string `json:"name"`
	Alias       string `json:"alias"`
	Description string `json:"description,omitempty"  optional:"true"`

	// Project defines the project this Env belongs to
	Project NameAlias `json:"project"`
	// Namespace defines the K8s namespace of the Env in control plane
	Namespace string `json:"namespace"`

	// Targets defines the name of delivery target that belongs to this env
	// In one project, a delivery target can only belong to one env.
	Targets []NameAlias `json:"targets,omitempty"  optional:"true"`

	CreateTime time.Time `json:"createTime"`
	UpdateTime time.Time `json:"updateTime"`
}

// ListEnvOptions list envs by query options
type ListEnvOptions struct {
	Project string `json:"project"`
}

// ListEnvResponse response the while env list
type ListEnvResponse struct {
	Envs  []*Env `json:"envs"`
	Total int64  `json:"total"`
}

// CreateEnvRequest contains the env data as request body
type CreateEnvRequest struct {
	Name        string `json:"name" validate:"checkname"`
	Alias       string `json:"alias" validate:"checkalias" optional:"true"`
	Description string `json:"description,omitempty"  optional:"true"`

	// Project defines the project this Env belongs to
	Project string `json:"project"`
	// Namespace defines the K8s namespace of the Env in control plane
	Namespace string `json:"namespace"`

	// Targets defines the name of delivery target that belongs to this env
	// In one project, a delivery target can only belong to one env.
	Targets []string `json:"targets,omitempty"  optional:"true"`

	// AllowTargetConflict means allow binding the targets that belong to other envs
	AllowTargetConflict bool `json:"allowTargetConflict,omitempty"  optional:"true"`
}

// UpdateEnvRequest defines the data of Env for update
type UpdateEnvRequest struct {
	Alias       string `json:"alias" validate:"checkalias" optional:"true"`
	Description string `json:"description,omitempty"  optional:"true"`
	// Targets defines the name of delivery target that belongs to this env
	// In one project, a delivery target can only belong to one env.
	Targets []string `json:"targets,omitempty"  optional:"true"`
}

// ListDefinitionResponse list definition response model
type ListDefinitionResponse struct {
	Definitions []*DefinitionBase `json:"definitions"`
}

// DefinitionRevision is one revision of a definition, as an Application pins it.
type DefinitionRevision struct {
	// Revision is the revision's number, which counts up with every change.
	Revision int64 `json:"revision"`
	// Version is what follows @ in a type pinned to the revision: v2 for a
	// numbered revision, v1.2.0 for one the definition's spec.version names.
	Version    string    `json:"version"`
	Hash       string    `json:"hash"`
	CreateTime time.Time `json:"createTime"`
}

// ListDefinitionRevisionsResponse is a definition's revisions, newest first.
type ListDefinitionRevisionsResponse struct {
	Revisions []DefinitionRevision `json:"revisions"`
}

// DetailDefinitionResponse get definition detail
type DetailDefinitionResponse struct {
	DefinitionBase
	APISchema *openapi3.Schema `json:"schema"`
	UISchema  schema.UISchema  `json:"uiSchema"`
	// OutputSchema is a source definition's `schema`: the value an
	// Application reads with $(source.<name>).
	OutputSchema *openapi3.Schema `json:"outputSchema,omitempty"`
}

// UpdateUISchemaRequest the request body struct about updated ui schema
type UpdateUISchemaRequest struct {
	DefinitionType string          `json:"type"`
	UISchema       schema.UISchema `json:"uiSchema"`
}

// UpdateDefinitionStatusRequest the request body struct about updated definition
// Only support set the status of definition
type UpdateDefinitionStatusRequest struct {
	DefinitionType string `json:"type"`
	HiddenInUI     bool   `json:"hiddenInUI"`
}

// DefinitionBase is the definition base model
type DefinitionBase struct {
	Name        string            `json:"name"`
	Alias       string            `json:"alias"`
	Description string            `json:"description"`
	Icon        string            `json:"icon"`
	Status      string            `json:"status"`
	Labels      map[string]string `json:"labels"`
	Category    string            `json:"category"`
	// WorkloadType the component workload type
	// Deprecated: it same as component.workload.type
	WorkloadType string `json:"workloadType,omitempty"`
	// OwnerAddon indicates which addon created this definition
	OwnerAddon   string                              `json:"ownerAddon"`
	Trait        *v1beta1.TraitDefinitionSpec        `json:"trait,omitempty"`
	Component    *v1beta1.ComponentDefinitionSpec    `json:"component,omitempty"`
	Policy       *v1beta1.PolicyDefinitionSpec       `json:"policy,omitempty"`
	WorkflowStep *v1beta1.WorkflowStepDefinitionSpec `json:"workflowStep,omitempty"`
	Source       *v1beta1.SourceDefinitionSpec       `json:"source,omitempty"`
	// PolicyScope is how KubeVela applies a policy: Builtin, consumed by
	// KubeVela itself; Workload, rendered with the Application's components; or
	// Application, applied to the Application as a whole before it renders.
	PolicyScope string `json:"policyScope,omitempty"`
	// Restrictions are the namespaces that may use the definition and its quota,
	// as the Application webhook enforces them: spec.restrictions combined with
	// the restrict-namespaces annotation. Absent means unrestricted.
	Restrictions *common.DefinitionRestrictions `json:"restrictions,omitempty"`
	// UnusableIn are the namespaces asked about whose Applications the
	// restrictions keep from using the definition.
	UnusableIn []string `json:"unusableIn,omitempty"`
	// Abstract marks a definition that may only be extended, never used by an
	// Application directly.
	Abstract bool `json:"abstract,omitempty"`
	// Extends names the definition this one is built on.
	Extends string `json:"extends,omitempty"`
}

// DefinitionUsageResponse is how much each namespace uses a definition, against
// the quota that governs it.
type DefinitionUsageResponse struct {
	Usage []NamespaceUsage `json:"usage"`
}

// Usage states: how a namespace's use of a definition compares with its quota.
const (
	// UsageStateOK is use below the level the quota flags.
	UsageStateOK = "ok"
	// UsageStateWarn is use at or above the quota's warn level.
	UsageStateWarn = "warn"
	// UsageStateOver is use beyond the quota's limit; the next Application to add
	// to it is refused.
	UsageStateOver = "over"
	// UsageStateExempt is a namespace annotated to skip every quota.
	UsageStateExempt = "exempt"
	// UsageStateUnlimited is a namespace no quota entry governs.
	UsageStateUnlimited = "unlimited"
)

// NamespaceUsage is one namespace's use of a definition, counted as the
// Application webhook counts it, with the quota entry that governs it.
type NamespaceUsage struct {
	Namespace string `json:"namespace"`
	Used      int    `json:"used"`
	Warn      *int32 `json:"warn,omitempty"`
	Limit     *int32 `json:"limit,omitempty"`
	State     string `json:"state"`
}

// CreatePolicyRequest create app policy
type CreatePolicyRequest struct {
	// Name is the unique name of the policy.
	Name        string `json:"name" validate:"checkname"`
	Alias       string `json:"alias"`
	EnvName     string `json:"envName"`
	Description string `json:"description"`
	Type        string `json:"type" validate:"checktype"`
	// Properties json data
	Properties string `json:"properties"`

	// Bind this policy to workflow
	WorkflowPolicyBindings []WorkflowPolicyBinding `json:"workflowPolicyBind"`
}

// SourceBase is a source of an application: an external value its
// properties read with $(source.<name>).
type SourceBase struct {
	Name string `json:"name"`
	Type string `json:"type"`
	// Properties is the source's parameter, as a JSON object.
	Properties *model.JSONStruct `json:"properties,omitempty"`
	// AutoUpdate is whether a change to the source's value re-dispatches what
	// reads it; unset follows the controller's default.
	AutoUpdate *bool `json:"autoUpdate,omitempty"`
}

// ListApplicationSourceResponse lists the sources of an application
type ListApplicationSourceResponse struct {
	Sources []*SourceBase `json:"sources"`
}

// CreateSourceRequest adds a source to an application
type CreateSourceRequest struct {
	// Name is the binding expressions read it by, $(source.<name>), so a CEL
	// identifier: clusterInfo, not cluster-info.
	Name string `json:"name" validate:"checkidentifier"`
	Type string `json:"type" validate:"checktype"`
	// Properties json data
	Properties string `json:"properties"`
	// AutoUpdate is the binding's own say; unset follows the controller's default,
	// which a deploy's publishVersion pin holds. True stays live under the pin.
	AutoUpdate *bool `json:"autoUpdate,omitempty"`
}

// UpdateSourceRequest changes the type or parameter of an application source
type UpdateSourceRequest struct {
	Type string `json:"type" validate:"checktype"`
	// Properties json data
	Properties string `json:"properties"`
	// AutoUpdate is the binding's own say; unset follows the controller's default,
	// which a deploy's publishVersion pin holds. True stays live under the pin.
	AutoUpdate *bool `json:"autoUpdate,omitempty"`
}

// WorkflowPolicyBinding define the relation binding relationShip between policy and workflowStep
type WorkflowPolicyBinding struct {
	Name  string   `json:"name"`
	Steps []string `json:"steps"`
}

// UpdatePolicyRequest update policy
type UpdatePolicyRequest struct {
	Alias       string `json:"alias"`
	EnvName     string `json:"envName"`
	Description string `json:"description"`
	Type        string `json:"type" validate:"checktype"`
	// Properties json data
	Properties string `json:"properties"`

	// Bind this policy to workflow
	WorkflowPolicyBindings []WorkflowPolicyBinding `json:"workflowPolicyBind"`
}

// PolicyBase application policy base info
type PolicyBase struct {
	// Name is the unique name of the policy.
	Name        string `json:"name"`
	Alias       string `json:"alias"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Creator     string `json:"creator"`
	// Properties json data
	Properties *model.JSONStruct `json:"properties"`
	CreateTime time.Time         `json:"createTime"`
	UpdateTime time.Time         `json:"updateTime"`
	EnvName    string            `json:"envName"`
}

// DetailPolicyResponse app policy detail model
type DetailPolicyResponse struct {
	PolicyBase
	// Binding relationShip
	WorkflowPolicyBindings []WorkflowPolicyBinding `json:"workflowPolicyBind,omitempty"`
}

// ListApplicationPolicy list app policies
type ListApplicationPolicy struct {
	Policies []*PolicyBase `json:"policies"`
}

// ListPolicyDefinitionResponse list available
type ListPolicyDefinitionResponse struct {
	PolicyDefinitions []PolicyDefinition `json:"policyDefinitions"`
}

// PolicyDefinition application policy definition
type PolicyDefinition struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Parameters  []types.Parameter `json:"parameters"`
}

// CreateWorkflowRequest create workflow  request
type CreateWorkflowRequest struct {
	Name        string         `json:"name" validate:"checkname"`
	Alias       string         `json:"alias" validate:"checkalias" optional:"true"`
	Description string         `json:"description" optional:"true"`
	Steps       []WorkflowStep `json:"steps,omitempty"`
	// Ref names a shared Workflow to run in place of steps; its modes may then
	// be empty, to follow the shared one's.
	Ref     string `json:"ref,omitempty" optional:"true"`
	Mode    string `json:"mode" validate:"omitempty,oneof=DAG StepByStep"`
	SubMode string `json:"subMode" validate:"omitempty,oneof=DAG StepByStep"`
	Default *bool  `json:"default"`
	EnvName string `json:"envName" validate:"checkname"`
}

// UpdateWorkflowRequest update or create application workflow
type UpdateWorkflowRequest struct {
	Alias       string         `json:"alias"  validate:"checkalias" optional:"true"`
	Description string         `json:"description" optional:"true"`
	Steps       []WorkflowStep `json:"steps,omitempty"`
	// Ref names a shared Workflow to run in place of steps; its modes may then
	// be empty, to follow the shared one's.
	Ref     string `json:"ref,omitempty" optional:"true"`
	Mode    string `json:"mode" validate:"omitempty,oneof=DAG StepByStep"`
	SubMode string `json:"subMode" validate:"omitempty,oneof=DAG StepByStep"`
	Default *bool  `json:"default"`
}

// WorkflowStep workflow step config
type WorkflowStep struct {
	WorkflowStepBase `json:",inline"`
	Mode             string             `json:"mode,omitempty" validate:"checkMode"`
	SubSteps         []WorkflowStepBase `json:"subSteps,omitempty"`
}

// WorkflowStepBase is the step base of workflow
type WorkflowStepBase struct {
	// Name is the unique name of the workflow step.
	Name        string                            `json:"name" validate:"checkname"`
	Alias       string                            `json:"alias" validate:"checkalias" optional:"true"`
	Type        string                            `json:"type" validate:"checkname"`
	Description string                            `json:"description" optional:"true"`
	DependsOn   []string                          `json:"dependsOn" optional:"true"`
	Properties  Properties                        `json:"properties,omitempty"`
	Meta        *wfTypesv1alpha1.WorkflowStepMeta `json:"meta,omitempty" optional:"true"`
	If          string                            `json:"if,omitempty" optional:"true"`
	Timeout     string                            `json:"timeout,omitempty" optional:"true"`
	Inputs      wfTypesv1alpha1.StepInputs        `json:"inputs,omitempty" optional:"true"`
	Outputs     wfTypesv1alpha1.StepOutputs       `json:"outputs,omitempty" optional:"true"`
}

// Properties unmarshal object or string
type Properties map[string]interface{}

// UnmarshalJSON support to unmarshal the string and struct
func (p *Properties) UnmarshalJSON(src []byte) error {
	var tryMap = map[string]interface{}{}
	if err := json.Unmarshal(src, &tryMap); err == nil {
		*p = tryMap
		return nil
	}
	var tryStr string
	err := json.Unmarshal(src, &tryStr)
	if err == nil {
		if err := json.Unmarshal([]byte(tryStr), &tryMap); err != nil {
			return err
		}
		*p = tryMap
		return nil
	}
	return err
}

// DetailWorkflowResponse detail workflow response
type DetailWorkflowResponse struct {
	WorkflowBase
}

// ListWorkflowResponse list application workflows
type ListWorkflowResponse struct {
	Workflows []*WorkflowBase `json:"workflows"`
}

// WorkflowBase workflow base model
type WorkflowBase struct {
	Name        string         `json:"name"`
	Alias       string         `json:"alias"`
	Description string         `json:"description"`
	Enable      bool           `json:"enable"`
	Default     bool           `json:"default"`
	EnvName     string         `json:"envName"`
	CreateTime  time.Time      `json:"createTime"`
	UpdateTime  time.Time      `json:"updateTime"`
	Mode        string         `json:"mode"`
	SubMode     string         `json:"subMode"`
	Steps       []WorkflowStep `json:"steps,omitempty"`
	// Ref names the shared Workflow this one runs, its steps shown in Steps;
	// SharedMode and SharedSubMode are that Workflow's own modes, which apply
	// where Mode and SubMode are empty.
	Ref           string `json:"ref,omitempty"`
	SharedScope   string `json:"sharedScope,omitempty"`
	SharedMode    string `json:"sharedMode,omitempty"`
	SharedSubMode string `json:"sharedSubMode,omitempty"`
}

// SharedWorkflow is a Workflow resource a workflow can reference: the
// project's, in its namespace, or global, in the system namespace. A global
// one is hidden where the project has one of its name, as KubeVela runs that.
type SharedWorkflow struct {
	Name        string         `json:"name"`
	Namespace   string         `json:"namespace"`
	Scope       string         `json:"scope"`
	Alias       string         `json:"alias,omitempty"`
	Description string         `json:"description,omitempty"`
	Hidden      bool           `json:"hidden,omitempty"`
	Mode        string         `json:"mode,omitempty"`
	SubMode     string         `json:"subMode,omitempty"`
	Steps       []WorkflowStep `json:"steps"`
	// UsedBy lists the project's workflows that run this one; UsedElsewhere
	// counts other projects' workflows, which are not named.
	UsedBy        []SharedWorkflowUse `json:"usedBy,omitempty"`
	UsedElsewhere int                 `json:"usedElsewhere,omitempty"`
}

// SharedWorkflowUse is an application workflow that references a shared one.
type SharedWorkflowUse struct {
	AppName       string `json:"appName"`
	AppAlias      string `json:"appAlias,omitempty"`
	WorkflowName  string `json:"workflowName"`
	WorkflowAlias string `json:"workflowAlias,omitempty"`
	EnvName       string `json:"envName"`
}

// ListSharedWorkflowsResponse lists the shared Workflows a workflow can reference.
type ListSharedWorkflowsResponse struct {
	Workflows []SharedWorkflow `json:"workflows"`
	// GlobalUnavailable says the global shared workflows could not be read, so
	// only the project's are listed.
	GlobalUnavailable bool `json:"globalUnavailable,omitempty"`
	// ProjectUnavailable says the environment's Applications run outside the
	// project's namespace, so KubeVela cannot find the project's workflows.
	ProjectUnavailable bool `json:"projectUnavailable,omitempty"`
	// ProjectNamespace is the namespace holding the project's.
	ProjectNamespace string `json:"projectNamespace,omitempty"`
}

// SharedWorkflowRequest creates or updates a shared Workflow. Name is only read
// on create.
type SharedWorkflowRequest struct {
	Name        string         `json:"name" validate:"checkname"`
	Alias       string         `json:"alias" validate:"checkalias" optional:"true"`
	Description string         `json:"description" optional:"true"`
	Mode        string         `json:"mode" validate:"omitempty,oneof=DAG StepByStep"`
	SubMode     string         `json:"subMode" validate:"omitempty,oneof=DAG StepByStep"`
	Steps       []WorkflowStep `json:"steps"`
}

// ListWorkflowRecordsResponse list workflow execution record
type ListWorkflowRecordsResponse struct {
	Records []WorkflowRecord `json:"records"`
	Total   int64            `json:"total"`
}

const (
	// TriggerTypeWeb means trigger by web
	TriggerTypeWeb string = "web"
	// TriggerTypeAPI means trigger by api
	TriggerTypeAPI string = "api"
	// TriggerTypeWebhook means trigger by webhook
	TriggerTypeWebhook string = "webhook"
)

// DetailWorkflowRecordResponse get workflow record detail
type DetailWorkflowRecordResponse struct {
	WorkflowRecord
	DeployTime time.Time `json:"deployTime"`
	DeployUser string    `json:"deployUser"`
	Note       string    `json:"note"`
	// TriggerType the event trigger source, Web or API or Webhook
	TriggerType string `json:"triggerType"`
}

// WorkflowRecordBase workflow record base struct
type WorkflowRecordBase struct {
	Name                string    `json:"name"`
	Namespace           string    `json:"namespace"`
	WorkflowName        string    `json:"workflowName"`
	WorkflowAlias       string    `json:"workflowAlias"`
	ApplicationRevision string    `json:"applicationRevision"`
	StartTime           time.Time `json:"startTime,omitempty"`
	EndTime             time.Time `json:"endTime,omitempty"`
	Status              string    `json:"status"`
	Message             string    `json:"message"`
	Mode                string    `json:"mode"`
}

// WorkflowRecord workflow record
type WorkflowRecord struct {
	WorkflowRecordBase `json:",inline"`
	Steps              []model.WorkflowStepStatus `json:"steps,omitempty"`
}

// ApplicationDeployRequest the application deploy or update event request
type ApplicationDeployRequest struct {
	WorkflowName string `json:"workflowName"`
	// User note message, optional
	Note string `json:"note"`
	// TriggerType the event trigger source, Web or API or Webhook
	TriggerType string `json:"triggerType" validate:"oneof=web api webhook"`
	// Force set to True to ignore unfinished events.
	Force bool `json:"force"`
	// CodeInfo is the source code info of this deploy
	CodeInfo *model.CodeInfo `json:"codeInfo,omitempty"`
	// ImageInfo is the image code info of this deploy
	ImageInfo *model.ImageInfo `json:"imageInfo,omitempty"`
}

// ApplicationDeployResponse application deploy response body
type ApplicationDeployResponse struct {
	ApplicationRevisionBase `json:",inline"`
	WorkflowRecord          WorkflowRecordBase `json:"record"`
	// Warnings are what the API server returned with the admitted Application,
	// such as an admission webhook's notice that a namespace nears its quota.
	Warnings []string `json:"warnings,omitempty"`
}

// ApplicationRollbackResponse the response body that rollback with the revision
type ApplicationRollbackResponse struct {
	WorkflowRecord WorkflowRecordBase `json:"record"`
}

// ApplicationDockerhubWebhookResponse dockerhub webhook response body
type ApplicationDockerhubWebhookResponse struct {
	State       string `json:"state,omitempty"`
	Description string `json:"description,omitempty"`
	Context     string `json:"context,omitempty"`
	TargetURL   string `json:"target_url,omitempty"`
}

// VelaQLViewResponse query response
type VelaQLViewResponse map[string]interface{}

// PutApplicationEnvBindingRequest update app envbinding request body
type PutApplicationEnvBindingRequest struct {
}

// ListApplicationEnvBinding list app envBindings
type ListApplicationEnvBinding struct {
	EnvBindings []*EnvBindingBase `json:"envBindings"`
}

// CreateApplicationEnvbindingRequest new application env
type CreateApplicationEnvbindingRequest struct {
	EnvBinding
}

// CreateApplicationTraitRequest create application trait request
type CreateApplicationTraitRequest struct {
	Type        string `json:"type" validate:"checktype"`
	Alias       string `json:"alias,omitempty" validate:"checkalias" optional:"true"`
	Description string `json:"description,omitempty" optional:"true"`
	Properties  string `json:"properties"`
}

// UpdateApplicationTraitRequest update application trait req
type UpdateApplicationTraitRequest struct {
	Alias       string `json:"alias,omitempty" validate:"checkalias" optional:"true"`
	Description string `json:"description,omitempty" optional:"true"`
	Properties  string `json:"properties"`
}

// ApplicationTrait application trait
type ApplicationTrait struct {
	Type        string `json:"type"`
	Alias       string `json:"alias,omitempty"`
	Description string `json:"description,omitempty"`
	// Properties json data
	Properties *model.JSONStruct `json:"properties"`
	CreateTime time.Time         `json:"createTime"`
	UpdateTime time.Time         `json:"updateTime"`
}

// CreateTargetRequest  create delivery target request body
type CreateTargetRequest struct {
	Name        string                 `json:"name" validate:"checkname"`
	Alias       string                 `json:"alias,omitempty" validate:"checkalias" optional:"true"`
	Project     string                 `json:"project" validate:"checkname"`
	Description string                 `json:"description,omitempty" optional:"true"`
	Cluster     *ClusterTarget         `json:"cluster,omitempty"`
	Variable    map[string]interface{} `json:"variable,omitempty"`
}

// UpdateTargetRequest only support full quantity update
type UpdateTargetRequest struct {
	Alias       string                 `json:"alias,omitempty" validate:"checkalias" optional:"true"`
	Description string                 `json:"description,omitempty" optional:"true"`
	Variable    map[string]interface{} `json:"variable,omitempty"`
}

// ClusterTarget kubernetes delivery target
type ClusterTarget struct {
	ClusterName string `json:"clusterName" validate:"checkname"`
	Namespace   string `json:"namespace" optional:"true"`
}

// DetailTargetResponse detail Target response
type DetailTargetResponse struct {
	TargetBase
}

// ListTargetResponse list delivery target response body
type ListTargetResponse struct {
	Targets []TargetBase `json:"targets"`
	Total   int64        `json:"total"`
}

// TargetBase Target base model
type TargetBase struct {
	Name         string                 `json:"name"`
	Alias        string                 `json:"alias,omitempty" validate:"checkalias" optional:"true"`
	Description  string                 `json:"description,omitempty" optional:"true"`
	Cluster      *ClusterTarget         `json:"cluster,omitempty"`
	ClusterAlias string                 `json:"clusterAlias,omitempty"`
	Variable     map[string]interface{} `json:"variable,omitempty"`
	CreateTime   time.Time              `json:"createTime"`
	UpdateTime   time.Time              `json:"updateTime"`
	AppNum       int64                  `json:"appNum,omitempty"`
	Project      NameAlias              `json:"project"`
}

// ApplicationRevisionBase application revision base spec
type ApplicationRevisionBase struct {
	CreateTime time.Time  `json:"createTime"`
	Version    string     `json:"version"`
	Status     string     `json:"status"`
	Reason     string     `json:"reason,omitempty"`
	DeployUser *NameAlias `json:"deployUser,omitempty"`
	Note       string     `json:"note"`
	EnvName    string     `json:"envName"`
	// TriggerType the event trigger source, Web or API or Webhook
	TriggerType string `json:"triggerType"`
	// WorkflowName deploy controller by workflow
	WorkflowName string `json:"workflowName"`
	// CodeInfo is the code info of this application revision
	CodeInfo *model.CodeInfo `json:"codeInfo,omitempty"`
	// ImageInfo is the image info of this application revision
	ImageInfo *model.ImageInfo `json:"imageInfo,omitempty"`
}

// ListRevisionsResponse list application revisions
type ListRevisionsResponse struct {
	Revisions []ApplicationRevisionBase `json:"revisions"`
	Total     int64                     `json:"total"`
}

// DetailRevisionResponse get application revision detail
type DetailRevisionResponse struct {
	model.ApplicationRevision
	DeployUser NameAlias `json:"deployUser,omitempty"`
}

// SystemInfoResponse get SystemInfo
type SystemInfoResponse struct {
	SystemInfo
	SystemVersion SystemVersion `json:"systemVersion"`
	StatisticInfo StatisticInfo `json:"statisticInfo,omitempty"`
}

// SystemInfo system info
type SystemInfo struct {
	PlatformID                  string             `json:"platformID"`
	EnableCollection            bool               `json:"enableCollection"`
	LoginType                   string             `json:"loginType" validate:"oneof=dex local"`
	InstallTime                 time.Time          `json:"installTime,omitempty"`
	DexUserDefaultProjects      []model.ProjectRef `json:"dexUserDefaultProjects,omitempty"`
	DexUserDefaultPlatformRoles []string           `json:"dexUserDefaultPlatformRoles,omitempty"`
}

// StatisticInfo generated by cronJob running in backend
type StatisticInfo struct {
	ClusterCount               string            `json:"clusterCount,omitempty"`
	AppCount                   string            `json:"appCount,omitempty"`
	EnableAddonList            map[string]string `json:"enableAddonList,omitempty"`
	ComponentDefinitionTopList []string          `json:"componentDefinitionTopList,omitempty"`
	TraitDefinitionTopList     []string          `json:"traitDefinitionTopList,omitempty"`
	WorkflowDefinitionTopList  []string          `json:"workflowDefinitionTopList,omitempty"`
	PolicyDefinitionTopList    []string          `json:"policyDefinitionTopList,omitempty"`
	UpdateTime                 time.Time         `json:"updateTime,omitempty"`
}

// SystemInfoRequest request by update SystemInfo
type SystemInfoRequest struct {
	EnableCollection       bool               `json:"enableCollection"`
	LoginType              string             `json:"loginType"`
	VelaAddress            string             `json:"velaAddress,omitempty"`
	DexUserDefaultProjects []model.ProjectRef `json:"dexUserDefaultProjects,omitempty"`
}

// SystemVersion contains KubeVela version
type SystemVersion struct {
	VelaVersion string `json:"velaVersion"`
	GitVersion  string `json:"gitVersion"`
}

// ChartVersionListResponse contains helm chart versions info
type ChartVersionListResponse struct {
	Versions repo.ChartVersions `json:"versions"`
}

// SimpleResponse simple response model for temporary
type SimpleResponse struct {
	Status string `json:"status"`
}

// LoginRequest is the request body for login
type LoginRequest struct {
	Code     string `json:"code,omitempty" optional:"true"`
	Username string `json:"username,omitempty" optional:"true"`
	Password string `json:"password,omitempty" optional:"true"`
}

// LoginResponse is the response of login request
type LoginResponse struct {
	User         *UserBase `json:"user"`
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
}

// RefreshTokenResponse is the response of refresh token request
type RefreshTokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

// DexConfigResponse is the response of dex config
type DexConfigResponse struct {
	ClientID     string `json:"clientID"`
	ClientSecret string `json:"clientSecret"`
	RedirectURL  string `json:"redirectURL"`
	Issuer       string `json:"issuer"`
}

// DetailUserResponse is the response of user detail
type DetailUserResponse struct {
	UserBase
	Projects []*UserProjectBase `json:"projects"`
	Roles    []NameAlias        `json:"roles"`
}

// UserProjectBase user project base model
type UserProjectBase struct {
	Name        string      `json:"name"`
	Alias       string      `json:"alias"`
	Description string      `json:"description"`
	JoinTime    time.Time   `json:"joinTime"`
	Owner       NameAlias   `json:"owner,omitempty"`
	Roles       []NameAlias `json:"roles"`
}

// ProjectUserBase project user base
type ProjectUserBase struct {
	UserName   string    `json:"name"`
	UserAlias  string    `json:"alias"`
	UserRoles  []string  `json:"userRoles"`
	CreateTime time.Time `json:"createTime"`
	UpdateTime time.Time `json:"updateTime"`
}

// ListProjectUsersResponse the response body that list users belong to a project
type ListProjectUsersResponse struct {
	Users []*ProjectUserBase `json:"users"`
	Total int64              `json:"total"`
}

// CreateUserRequest create user request
type CreateUserRequest struct {
	Name     string   `json:"name" validate:"checkname"`
	Alias    string   `json:"alias,omitempty" validate:"checkalias" optional:"true"`
	Email    string   `json:"email" validate:"checkemail"`
	Password string   `json:"password" validate:"checkpassword"`
	Roles    []string `json:"roles"`
}

// UpdateUserRequest update user request
type UpdateUserRequest struct {
	Alias    string    `json:"alias,omitempty" optional:"true"`
	Password string    `json:"password,omitempty" validate:"checkpassword" optional:"true"`
	Email    string    `json:"email,omitempty" validate:"checkemail" optional:"true"`
	Roles    *[]string `json:"roles"`
}

// ListUserResponse list user response
type ListUserResponse struct {
	Users []*DetailUserResponse `json:"users"`
	Total int64                 `json:"total"`
}

// UserBase is the base info of user
type UserBase struct {
	CreateTime    time.Time `json:"createTime"`
	LastLoginTime time.Time `json:"lastLoginTime"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Alias         string    `json:"alias,omitempty"`
	Disabled      bool      `json:"disabled"`
}

// ListUserOptions list user options
type ListUserOptions struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Alias string `json:"alias"`
}

// GetLoginTypeResponse get login type response
type GetLoginTypeResponse struct {
	LoginType string `json:"loginType"`
}

// AddProjectUserRequest the request body that add user to project
type AddProjectUserRequest struct {
	UserName  string   `json:"userName" validate:"checkname"`
	UserRoles []string `json:"userRoles"`
}

// UpdateProjectUserRequest the request body that update user role in a project
type UpdateProjectUserRequest struct {
	UserRoles []string `json:"userRoles"`
}

// CreateRoleRequest the request body that create a role
type CreateRoleRequest struct {
	Name        string   `json:"name" validate:"checkname"`
	Alias       string   `json:"alias" validate:"checkalias"`
	Permissions []string `json:"permissions"`
}

// UpdateRoleRequest the request body that update a role
type UpdateRoleRequest struct {
	Alias       string   `json:"alias" validate:"checkalias"`
	Permissions []string `json:"permissions"`
}

// RoleBase the base struct of role
type RoleBase struct {
	CreateTime  time.Time   `json:"createTime"`
	UpdateTime  time.Time   `json:"updateTime"`
	Name        string      `json:"name"`
	Alias       string      `json:"alias,omitempty"`
	Permissions []NameAlias `json:"permissions"`
}

// ListRolesResponse the response body of list roles
type ListRolesResponse struct {
	Total int64       `json:"total"`
	Roles []*RoleBase `json:"roles"`
}

// PermissionTemplateBase the perm policy template base struct
type PermissionTemplateBase struct {
	Name       string    `json:"name"`
	Alias      string    `json:"alias"`
	Resources  []string  `json:"resources"`
	Actions    []string  `json:"actions"`
	Effect     string    `json:"effect"`
	CreateTime time.Time `json:"createTime"`
	UpdateTime time.Time `json:"updateTime"`
}

// PermissionBase the perm policy base struct
type PermissionBase struct {
	Name       string    `json:"name"`
	Alias      string    `json:"alias"`
	Resources  []string  `json:"resources"`
	Actions    []string  `json:"actions"`
	Effect     string    `json:"effect"`
	CreateTime time.Time `json:"createTime"`
	UpdateTime time.Time `json:"updateTime"`
}

// UpdatePermissionRequest the request body that updating a permission policy
type UpdatePermissionRequest struct {
	Alias     string   `json:"alias" validate:"checkalias"`
	Resources []string `json:"resources"`
	Actions   []string `json:"actions"`
	Effect    string   `json:"effect" validate:"oneof=Allow Deny"`
}

// CreatePermissionRequest the request body that creating a permission policy
type CreatePermissionRequest struct {
	Name      string   `json:"name" validate:"checkname"`
	Alias     string   `json:"alias" validate:"checkalias"`
	Resources []string `json:"resources"`
	Actions   []string `json:"actions"`
	Effect    string   `json:"effect" validate:"oneof=Allow Deny"`
}

// LoginUserInfoResponse the response body of login user info
type LoginUserInfoResponse struct {
	UserBase
	Projects            []*UserProjectBase          `json:"projects"`
	PlatformPermissions []PermissionBase            `json:"platformPermissions"`
	ProjectPermissions  map[string][]PermissionBase `json:"projectPermissions"`
}

// AdminConfiguredResponse the response body of check admin configured
type AdminConfiguredResponse struct {
	Configured bool `json:"configured"`
}

// InitAdminRequest the request body of init admin
type InitAdminRequest struct {
	Name     string `json:"name" validate:"checkname"`
	Password string `json:"password" validate:"checkpassword"`
	Email    string `json:"email" validate:"checkemail"`
}

// InitAdminResponse the response body of init admin
type InitAdminResponse struct {
	Success bool `json:"success"`
}

// ChartRepoResponse the response body of  chart repo
type ChartRepoResponse struct {
	URL        string `json:"url"`
	SecretName string `json:"secretName"`
}

// ChartRepoResponseList the response body of list chart repo
type ChartRepoResponseList struct {
	ChartRepoResponse []*ChartRepoResponse `json:"repos"`
}

// ImageInfo the docker image info
type ImageInfo struct {
	Name        string                 `json:"name"`
	SecretNames []string               `json:"secretNames"`
	Registry    string                 `json:"registry"`
	Message     string                 `json:"message,omitempty"`
	Info        *registryv1.ConfigFile `json:"info,omitempty"`
	Size        int64                  `json:"size"`
	Manifest    *registryv1.Manifest   `json:"manifest"`
}

// ImageRegistry the image repository info
type ImageRegistry struct {
	Name       string         `json:"name"`
	SecretName string         `json:"secretName"`
	Domain     string         `json:"domain"`
	Secret     *corev1.Secret `json:"-"`
}

// ListImageRegistryResponse the response struct of listing the image registries
type ListImageRegistryResponse struct {
	Registries []ImageRegistry `json:"registries"`
}

// CloudShellPrepareResponse the response for the cloud shell environment creation
type CloudShellPrepareResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// ConfigType define the format for listing configuration types
type ConfigType struct {
	Definitions []string `json:"definitions"`
	Alias       string   `json:"alias"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
}

// TerraformProvider define the metadata of a terraform provider
type TerraformProvider struct {
	Name       string    `json:"name"`
	Region     string    `json:"region"`
	Provider   string    `json:"provider"`
	CreateTime time.Time `json:"createTime"`
}

// ListTerraformProviderResponse is the response body for listing the terraform provider
type ListTerraformProviderResponse struct {
	Providers []*TerraformProvider `json:"providers"`
}

// NamespacedName the name is required and the namespace is optional
type NamespacedName struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace" optional:"true"`
}

// CreateConfigDistributionRequest the request body of applying the distribution job.
type CreateConfigDistributionRequest struct {
	Name    string            `json:"name"`
	Configs []*NamespacedName `json:"configs"`
	Targets []*ClusterTarget  `json:"targets"`
}

// ListConfigDistributionResponse is the response body for listing the distribution
type ListConfigDistributionResponse struct {
	Distributions []*config.Distribution `json:"distributions"`
}

/********************/
/* Pipeline Structs */
/********************/

// PipelineMeta is metadata of pipeline
type PipelineMeta struct {
	Name        string    `json:"name"`
	Alias       string    `json:"alias"`
	Project     NameAlias `json:"project"`
	Description string    `json:"description"`
	CreateTime  time.Time `json:"createTime"`
}

// PipelineBase is the base info of pipeline
type PipelineBase struct {
	PipelineMeta `json:",inline"`
	Spec         model.WorkflowSpec `json:"spec"`
}

// RunStatInfo is the pipeline run statistics info
type RunStatInfo struct {
	Total   int `json:"total"`
	Success int `json:"success"`
	Fail    int `json:"fail"`
}

// RunStat is the statistics of the pipeline in seven days
type RunStat struct {
	ActiveNum int           `json:"activeNum"`
	Total     RunStatInfo   `json:"total"`
	Week      []RunStatInfo `json:"week"`
}

// CreatePipelineRequest is the request body of creating pipeline
type CreatePipelineRequest struct {
	Name        string             `json:"name" validate:"checkname"`
	Alias       string             `json:"alias" validate:"checkalias" optional:"true"`
	Description string             `json:"description" optional:"true"`
	Spec        model.WorkflowSpec `json:"spec"`
}

// PipelineMetaResponse is the response body contains PipelineMeta
type PipelineMetaResponse struct {
	PipelineMeta `json:",inline"`
}

// ListPipelineRequest is the request body of listing pipeline
type ListPipelineRequest struct {
	Projects []string `json:"projects" optional:"true"`
	Query    string   `json:"query" optional:"true"`
	Detailed bool     `json:"detailed" optional:"true"`
}

// ListPipelineResponse is the response body of listing pipeline
type ListPipelineResponse struct {
	Total     int                `json:"total"`
	Pipelines []PipelineListItem `json:"pipelines"`
}

// PipelineListItem is the item of pipeline list
type PipelineListItem struct {
	PipelineMeta `json:",inline"`
	Info         PipelineInfo `json:"info"`
}

// UpdatePipelineRequest is the request body of updating pipeline
type UpdatePipelineRequest struct {
	Alias       string             `json:"alias" validate:"checkalias" optional:"true"`
	Description string             `json:"description" optional:"true"`
	Spec        model.WorkflowSpec `json:"spec" optional:"true"`
}

// GetPipelineResponse is the response body of getting pipeline
type GetPipelineResponse struct {
	PipelineBase `json:",inline"`
	PipelineInfo `json:"info"`
}

// PipelineInfo is the info of pipeline
type PipelineInfo struct {
	LastRun *PipelineRun `json:"lastRun"`
	RunStat RunStat      `json:"runStat"`
}

/***********************/
/* PipelineRun Structs */
/***********************/

// PipelineRunBriefing is the brief info of the pipeline run, contains run name and brief status
type PipelineRunBriefing struct {
	PipelineRunName string                            `json:"pipelineRunName"`
	Finished        bool                              `json:"finished"`
	Phase           workflowv1alpha1.WorkflowRunPhase `json:"phase"`
	Message         string                            `json:"message"`
	StartTime       metav1.Time                       `json:"startTime"`
	EndTime         metav1.Time                       `json:"endTime"`
	ContextName     string                            `json:"contextName"`
	ContextValues   []model.Value                     `json:"contextValues"`
}

// PipelineRunMeta is the metadata of pipeline run
type PipelineRunMeta struct {
	PipelineName    string    `json:"pipelineName"`
	Project         NameAlias `json:"project"`
	PipelineRunName string    `json:"pipelineRunName"`
}

// PipelineRun is the info of pipeline run
type PipelineRun struct {
	PipelineRunBase `json:",inline"`
	Status          workflowv1alpha1.WorkflowRunStatus `json:"status"`
}

// PipelineRunBase is the base info of pipeline run
type PipelineRunBase struct {
	PipelineRunMeta `json:",inline"`
	// Record marks the run of the pipeline
	Record        int64                            `json:"record"`
	ContextName   string                           `json:"contextName"`
	ContextValues []model.Value                    `json:"contextValues"`
	Spec          workflowv1alpha1.WorkflowRunSpec `json:"spec"`
}

// RunPipelineRequest is the request body of running pipeline
type RunPipelineRequest struct {
	// Mode is the mode of the pipeline run. Available values are: "StepByStep", "DAG" for both `step` and `subStep`
	// default: "StepByStep" for `step`, "DAG" for `subStep`
	Mode        wfTypesv1alpha1.WorkflowExecuteMode `json:"mode" optional:"true"`
	ContextName string                              `json:"contextName"`
}

// ListPipelineRunResponse is the response body of listing pipeline run
type ListPipelineRunResponse struct {
	Total int64                 `json:"total"`
	Runs  []PipelineRunBriefing `json:"runs"`
}

// GetPipelineRunLogResponse is the response body of getting pipeline run log
type GetPipelineRunLogResponse struct {
	StepBase  `json:",inline"`
	LogSource string `json:"source"`
	Log       string `json:"log"`
}

// GetPipelineRunOutputResponse is the response body of getting pipeline run output
type GetPipelineRunOutputResponse struct {
	StepOutputs []StepOutputBase `json:"outputs"`
}

// GetPipelineRunInputResponse is the response body of getting pipeline run input
type GetPipelineRunInputResponse struct {
	StepInputs []StepInputBase `json:"inputs"`
}

// StepBase is the base info of step
type StepBase struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Type  string `json:"type"`
	Phase string `json:"phase"`
}

// StepOutputBase is the output of step
type StepOutputBase struct {
	StepBase `json:",inline"`
	Values   []OutputVar `json:"values"`
}

// StepInputBase is the input of step
type StepInputBase struct {
	StepBase `json:",inline"`
	Values   []InputVar `json:"values"`
}

// OutputVar is one output var
type OutputVar struct {
	Name      string `json:"name"`
	Value     string `json:"value"`
	ValueFrom string `json:"valueFrom"`
}

// InputVar is one input var
type InputVar struct {
	From         string `json:"from"`
	FromStep     string `json:"fromStep"`
	ParameterKey string `json:"parameterKey"`
	Value        string `json:"value"`
}

/*******************/
/* Context Structs */
/*******************/

// Context is an internal struct for the context
type Context struct {
	Name   string        `json:"name"`
	Values []model.Value `json:"values"`
}

// CreateContextValuesRequest is the request body of creating context values
type CreateContextValuesRequest struct {
	Name   string        `json:"name"`
	Values []model.Value `json:"values"`
}

// UpdateContextValuesRequest is the request body of updating context values
type UpdateContextValuesRequest struct {
	Values []model.Value `json:"values"`
}

// ContextNameResponse is the response body of getting context name
type ContextNameResponse struct {
	Name string `json:"name"`
}

// ListContextValueResponse is the response body of listing context values
type ListContextValueResponse struct {
	Total    int                      `json:"total"`
	Contexts map[string][]model.Value `json:"contexts"`
}

// ManagedPluginDTO the model for the plugin manager.
type ManagedPluginDTO struct {
	pluginTypes.JSONData
	Class         pluginTypes.Class `json:"class"`
	DefaultNavURL string            `json:"defaultNavURL"`
	// SystemJS fields
	Module  string `json:"module"`
	BaseURL string `json:"baseURL"`
	// Settings
	Enabled          bool                   `json:"enabled"`
	JSONSetting      map[string]interface{} `json:"jsonSetting"`
	SecureJSONFields map[string]bool        `json:"secureJsonFields"`
}

// PluginDTO the model for the common user.
type PluginDTO struct {
	ID   string           `json:"id"`
	Type pluginTypes.Type `json:"type"`
	// there are four sub types in the definition plugin type, includes: component, trait, policy ,and workflow-step.
	SubType       string                  `json:"subType"`
	Name          string                  `json:"name"`
	Info          pluginTypes.Info        `json:"info"`
	Includes      []*pluginTypes.Includes `json:"includes"`
	Category      string                  `json:"category"`
	DefaultNavURL string                  `json:"defaultNavURL"`
	// SystemJS fields
	Module  string `json:"module"`
	BaseURL string `json:"baseURL"`
}

// ListPluginResponse -
type ListPluginResponse struct {
	Plugins []PluginDTO `json:"plugins"`
}

// ListManagedPluginResponse -
type ListManagedPluginResponse struct {
	Plugins []ManagedPluginDTO `json:"plugins"`
}

// PluginSettingResponse plugin setting response model
type PluginSettingResponse struct {
	JSONData         map[string]interface{} `json:"jsonData"`
	SecureJSONFields map[string]bool        `json:"secureJsonFields"`
}

// PluginSetRequest plugin setting request model
type PluginSetRequest struct {
	JSONData       map[string]interface{} `json:"jsonData"`
	SecureJSONData map[string]interface{} `json:"secureJsonData"`
}

// PluginEnableRequest plugin enable request model
type PluginEnableRequest PluginSetRequest

// InstallPluginRequest requests for installation of VelaUX plugin
type InstallPluginRequest struct {
	URL     string                 `json:"url"`
	Disable bool                   `json:"disable,omitempty"`
	Options *velacommon.HTTPOption `json:"options,omitempty"`
}

// ExpressionEnvResponse is what a form needs to edit $( ) expressions for one
// surface of an application.
type ExpressionEnvResponse struct {
	// Enabled says this server offers expression editing at all.
	Enabled bool `json:"enabled"`
	// OptedIn says the application reads expressions: it carries the
	// app.oam.dev/cel-expressions annotation.
	OptedIn bool   `json:"optedIn"`
	Surface string `json:"surface"`
	// Variables are the roots an expression may read, with their fields.
	Variables []*ExpressionVariable `json:"variables"`
}

// DefinitionCUEResponse is a definition as CUE, as vela def get writes it.
type DefinitionCUEResponse struct {
	CUE string `json:"cue"`
}

// DefinitionDocResponse is a definition's reference documentation, in Markdown.
type DefinitionDocResponse struct {
	Markdown string `json:"markdown"`
}

// ExpressionVariable is a value an expression can read, and its fields.
type ExpressionVariable struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description,omitempty"`
	// Schema is the value's type as its CUE schema declares it.
	Schema   string                `json:"schema,omitempty"`
	Children []*ExpressionVariable `json:"children,omitempty"`
}

// ExpressionOptInRequest turns an application's reading of $( ) expressions
// on or off.
type ExpressionOptInRequest struct {
	Enabled bool `json:"enabled"`
}

// ExpressionCheckRequest asks whether a property value's expressions compile
// and what its value's type is.
type ExpressionCheckRequest struct {
	Surface string `json:"surface" validate:"required"`
	// Value is the property value as written, $( ) and all.
	Value string `json:"value"`
	// Kind is the type the parameter expects: string, integer, number,
	// boolean, or empty for any.
	Kind string `json:"kind,omitempty"`
	// Source names the source the value is written in, on the source surface:
	// it reads only the sources declared before it.
	Source string `json:"source,omitempty"`
	// Component names the component the value is written in, or the one its
	// trait is on: it cannot read its own output.
	Component string `json:"component,omitempty"`
}

// ExpressionCheckResponse reports on a property value's expressions.
type ExpressionCheckResponse struct {
	// Type is the value's type once its expressions are evaluated.
	Type   string             `json:"type,omitempty"`
	Issues []*ExpressionIssue `json:"issues,omitempty"`
}

// ExpressionIssue is a problem in a property value, at a position in it.
type ExpressionIssue struct {
	Message string `json:"message"`
	// Start and End are character offsets into the value.
	Start int `json:"start"`
	End   int `json:"end"`
	// Warning is set for an issue that does not stop the value being used.
	Warning bool `json:"warning,omitempty"`
	// Fix, where there is one, replaces the text from Start to End.
	Fix string `json:"fix,omitempty"`
}

// Customisation is how this VelaUX is branded, kept in the
// velaux-configuration ConfigMap.
type Customisation struct {
	// PageTitle is the browser tab's title.
	PageTitle string `json:"pageTitle,omitempty"`
	// LogoURL replaces the KubeVela wordmark; an http(s), data or same-origin URL.
	LogoURL string `json:"logoURL,omitempty"`
	// IconURL replaces the sail mark shown when the sidebar is minimised.
	IconURL string `json:"iconURL,omitempty"`
	// SidebarColor is the sidebar's background, a hex colour; its text is
	// light or dark to suit.
	SidebarColor string `json:"sidebarColor,omitempty"`
	// AccentColor marks the current page and highlights, a hex colour.
	AccentColor string `json:"accentColor,omitempty"`
	// Terminology renames the UI's words, keyed by the word as the UI writes it
	// in the singular: Application, Environment, Cluster.
	Terminology map[string]Term `json:"terminology,omitempty"`
}

// Term is the singular and plural a renamed word takes.
type Term struct {
	Singular string `json:"singular"`
	Plural   string `json:"plural"`
}

// PackageBase is a CUE package a definition can import: a Package resource in
// the cluster, or one built into KubeVela.
type PackageBase struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
	// Path is what a definition imports it as.
	Path    string `json:"path"`
	Builtin bool   `json:"builtin,omitempty"`
	// UsedBy names what can import a built-in package: components (with traits
	// and sources) or workflow steps.
	UsedBy []string `json:"usedBy,omitempty"`
	// Variant tells apart the built-in packages sharing a path: the one
	// components import and the one workflow steps do, where they differ.
	Variant    string           `json:"variant,omitempty"`
	Provider   *PackageProvider `json:"provider,omitempty"`
	Functions  int              `json:"functions"`
	Files      int              `json:"files"`
	CreateTime *time.Time       `json:"createTime,omitempty"`
}

// PackageProvider is the external server that runs a package's functions.
// Header values are left out: they often carry credentials.
type PackageProvider struct {
	Protocol string   `json:"protocol"`
	Endpoint string   `json:"endpoint"`
	Headers  []string `json:"headers,omitempty"`
}

// PackageField is one field of a function's parameters or results, or of a
// type, with its type as declared.
type PackageField struct {
	Name        string          `json:"name"`
	Type        string          `json:"type,omitempty"`
	Optional    bool            `json:"optional,omitempty"`
	Description string          `json:"description,omitempty"`
	Fields      []*PackageField `json:"fields,omitempty"`
}

// PackageFunction is a definition a package's provider runs: #do names the
// operation, $params what it takes and $returns what it gives back. Where one
// of those is not a struct, its type stands in the Type field instead.
type PackageFunction struct {
	Name        string          `json:"name"`
	Do          string          `json:"do"`
	Provider    string          `json:"provider,omitempty"`
	Description string          `json:"description,omitempty"`
	Params      []*PackageField `json:"params,omitempty"`
	ParamsType  string          `json:"paramsType,omitempty"`
	Returns     []*PackageField `json:"returns,omitempty"`
	ReturnsType string          `json:"returnsType,omitempty"`
	// Usage is how a definition calls it, with its required parameters.
	Usage string `json:"usage"`
}

// PackageType is a definition in a package that is not a function.
type PackageType struct {
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	Type        string          `json:"type,omitempty"`
	Fields      []*PackageField `json:"fields,omitempty"`
}

// PackageFile is one of a package's CUE files.
type PackageFile struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

// PackageDetail is a package with what it offers.
type PackageDetail struct {
	PackageBase
	// PackageName is the name its files declare, which a definition writes
	// before a function: mysql.#ListTables.
	PackageName string             `json:"packageName,omitempty"`
	Functions   []*PackageFunction `json:"functionList"`
	Types       []*PackageType     `json:"types"`
	FileList    []*PackageFile     `json:"fileList"`
	// Issue is why the package's files could not be read, where they could not.
	Issue string `json:"issue,omitempty"`
}

// ListPackagesResponse lists the packages.
type ListPackagesResponse struct {
	Packages []*PackageBase `json:"packages"`
}

// DataFlowEnd is one end of a data flow: a source binding or a component, at
// a placement where one is known.
type DataFlowEnd struct {
	// Kind is source or component.
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Cluster   string `json:"cluster,omitempty"`
	Namespace string `json:"namespace,omitempty"`
}

// DataFlowItem is one value moving along a flow: what was read from the
// producer, and which of the reader's properties received it.
type DataFlowItem struct {
	Read     string `json:"read"`
	Property string `json:"property,omitempty"`
	// Trait names the reader's trait that read it, where a trait did.
	Trait string `json:"trait,omitempty"`
	// Value is what was read, where KubeVela records it (sources), redacted as
	// it redacts it.
	Value interface{} `json:"value,omitempty"`
}

// DataFlow is what moves from one producer to one reader, and how: source,
// expression ($(component...)), inputs (outputs to inputs) or dependsOn (order
// only, no data).
type DataFlow struct {
	From  DataFlowEnd    `json:"from"`
	To    DataFlowEnd    `json:"to"`
	Via   string         `json:"via"`
	Items []DataFlowItem `json:"items"`
}

// ApplicationDataFlowsResponse is what moves between an env's sources and components.
type ApplicationDataFlowsResponse struct {
	Flows []*DataFlow `json:"flows"`
}

// ReportMeta is a report in the catalogue: a labelled ConfigMap, global in
// vela-system or local in the project's namespace.
type ReportMeta struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	// Scope is local or global; a global report is hidden where a local one
	// has its name.
	Scope  string `json:"scope"`
	Hidden bool   `json:"hidden,omitempty"`
	// Error says why the report cannot be run, where its CUE is not a report.
	Error string `json:"error,omitempty"`
	// Parameters is the form for the report's parameter block, if it has one.
	Parameters schema.UISchema `json:"parameters,omitempty"`
}

// ListReportsResponse is the catalogue of reports for a project.
type ListReportsResponse struct {
	Reports []ReportMeta `json:"reports"`
	// GlobalUnavailable says the global reports could not be read.
	GlobalUnavailable bool `json:"globalUnavailable,omitempty"`
}

// ReportColumn is a column of a report's table.
type ReportColumn struct {
	Key    string `json:"key"`
	Title  string `json:"title"`
	Format string `json:"format,omitempty"`
}

// ReportRow is a row of a report's table, with a link per column that has one.
type ReportRow struct {
	Values map[string]interface{} `json:"values"`
	Links  map[string]string      `json:"links,omitempty"`
}

// ReportPoint is a point on a report's chart: a value per series.
type ReportPoint struct {
	Label  string             `json:"label"`
	Values map[string]float64 `json:"values"`
}

// ReportChart summarises a report's rows: bar, line or pie.
type ReportChart struct {
	Type   string        `json:"type"`
	Title  string        `json:"title,omitempty"`
	Series []string      `json:"series"`
	Points []ReportPoint `json:"points"`
}

// ReportStat is a headline number of a report, shown above its chart.
type ReportStat struct {
	Label  string      `json:"label"`
	Value  interface{} `json:"value"`
	Format string      `json:"format,omitempty"`
	// Tone colours the number: healthy, unhealthy, progressing or neutral.
	Tone string `json:"tone,omitempty"`
}

// RunReportRequest is a report's parameters.
type RunReportRequest struct {
	Parameters map[string]interface{} `json:"parameters,omitempty"`
}

// ReportResult is a report run over one project.
type ReportResult struct {
	Report      ReportMeta     `json:"report"`
	Project     string         `json:"project"`
	GeneratedAt time.Time      `json:"generatedAt"`
	Columns     []ReportColumn `json:"columns"`
	Stats       []ReportStat   `json:"stats,omitempty"`
	Rows        []ReportRow    `json:"rows"`
	Chart       *ReportChart   `json:"chart,omitempty"`
}
