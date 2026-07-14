{{/*
Expand the name of the chart.
*/}}
{{- define "velaux.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "velaux.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart name and version as used by the chart label.
*/}}
{{- define "velaux.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "velaux.labels" -}}
helm.sh/chart: {{ include "velaux.chart" . }}
{{ include "velaux.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: kubevela
{{- end }}

{{/*
Selector labels
*/}}
{{- define "velaux.selectorLabels" -}}
app.kubernetes.io/name: {{ include "velaux.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
The name of the service account to use.
*/}}
{{- define "velaux.serviceAccountName" -}}
{{- default (include "velaux.fullname" .) .Values.serviceAccount.name }}
{{- end }}

{{/*
The full image reference.
*/}}
{{- define "velaux.image" -}}
{{- $tag := default .Chart.AppVersion .Values.image.tag -}}
{{- if .Values.image.registry -}}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.repository $tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository $tag -}}
{{- end -}}
{{- end }}

{{/*
Name of the CNPG Cluster provisioned by this chart.
*/}}
{{- define "velaux.cnpgName" -}}
{{- default (printf "%s-pg" (include "velaux.fullname" .)) .Values.datastore.cnpg.name }}
{{- end }}

{{/*
Effective datastore type. CNPG provisioning implies postgres.
*/}}
{{- define "velaux.datastoreType" -}}
{{- if .Values.datastore.cnpg.enabled -}}postgres{{- else -}}{{ .Values.datastore.type }}{{- end -}}
{{- end }}

{{/*
Name of the Secret holding the datastore connection URL, or empty when none is used.
An explicit urlExistingSecret.name wins; otherwise CNPG's generated "<cluster>-app" secret.
*/}}
{{- define "velaux.datastoreSecretName" -}}
{{- if .Values.datastore.urlExistingSecret.name -}}
{{- .Values.datastore.urlExistingSecret.name -}}
{{- else if .Values.datastore.cnpg.enabled -}}
{{- printf "%s-app" (include "velaux.cnpgName" .) -}}
{{- end -}}
{{- end }}

{{/*
Key within the datastore Secret that holds the URL.
*/}}
{{- define "velaux.datastoreSecretKey" -}}
{{- default "uri" .Values.datastore.urlExistingSecret.key }}
{{- end }}
