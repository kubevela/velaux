# VelaUX Helm Chart

Install [VelaUX](https://kubevela.io) — the KubeVela User Experience (UX) dashboard and
APIServer — into a Kubernetes cluster with Helm, instead of `vela addon enable velaux`.

VelaUX is the same `oamdev/velaux` image the official addon deploys; this chart wraps it in
plain Kubernetes manifests (Deployment, Service, ServiceAccount, RBAC, optional Ingress).

## Prerequisites

- Kubernetes >= 1.19
- Helm 3
- The KubeVela control plane (`vela-core`) already installed in the cluster.

## Install

```bash
# Typically installed alongside vela-core in the vela-system namespace
helm install velaux ./charts/velaux -n vela-system --create-namespace
```

### Expose via Ingress

```bash
helm install velaux ./charts/velaux -n vela-system \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.host=velaux.example.com
```

## Datastore & persistence

The VelaUX server is stateless — it stores nothing on the pod's disk, so a pod crash or
reschedule never loses data. Where the data lives depends on `datastore.type`:

| Type | Storage | Survives pod crash | Survives cluster/etcd loss |
| --- | --- | --- | --- |
| `kubeapi` (default) | ConfigMaps in etcd | yes | no |
| `mongodb` | external MongoDB | yes | yes |
| `postgres` | external PostgreSQL | yes | yes |
| `mysql` | external MySQL | yes | yes |

For SQL/Mongo backends VelaUX creates its own schema on startup (`AutoMigrate` for SQL), so
it only needs an empty database and a user that can create tables.

### PostgreSQL via CloudNativePG (CNPG)

Requires the [CNPG operator](https://cloudnative-pg.io) to be installed in the cluster.

**Option 1 — let the chart provision the database (simplest).** Enable `datastore.cnpg`
and the chart creates the CNPG `Cluster` for you, implies `datastore.type=postgres`, and wires
VelaUX to the cluster's generated app Secret automatically:

```bash
helm install velaux ./charts/velaux -n vela-system \
  --set datastore.cnpg.enabled=true \
  --set datastore.cnpg.instances=3 \
  --set datastore.cnpg.storage.size=5Gi
```

Or via a values file:

```yaml
# values-cnpg.yaml
datastore:
  cnpg:
    enabled: true
    instances: 3
    database: velaux
    owner: velaux
    storage:
      size: 5Gi
      # storageClass: ""
    # extraSpec:            # merged into the CNPG Cluster spec
    #   backup: { ... }
    #   resources: { ... }
```
```bash
helm install velaux ./charts/velaux -n vela-system -f values-cnpg.yaml
```

**Option 2 — bring your own CNPG cluster.** Create the `Cluster` yourself and point VelaUX at
its generated Secret (whose `uri` key is a ready-to-use connection string):

```bash
helm install velaux ./charts/velaux -n vela-system \
  --set datastore.type=postgres \
  --set datastore.urlExistingSecret.name=my-pg-app \
  --set datastore.urlExistingSecret.key=uri
```

In both cases the URL is injected as the `VELAUX_DATASTORE_URL` env var and referenced by the
server as `--datastore-url=$(VELAUX_DATASTORE_URL)`, so the password never appears in values or
the pod spec. If your cluster enforces TLS and the connection is rejected, supply your own
`datastore.url` ending in `?sslmode=require` instead of the secret.

> Note: VelaUX may CrashLoopBackOff for the first few seconds until CNPG reports the database
> ready — it recovers automatically once the cluster is up.

### External MongoDB

```bash
helm install velaux ./charts/velaux -n vela-system \
  --set datastore.type=mongodb \
  --set datastore.database=kubevela \
  --set datastore.url="mongodb://user:pass@mongo:27017"
```

## Accessing the dashboard

With the default `ClusterIP` service:

```bash
kubectl port-forward -n vela-system svc/velaux 8000:8000
# open http://127.0.0.1:8000
```

The initial admin password is printed in the server logs on first start.

## Key values

| Key | Default | Description |
| --- | --- | --- |
| `replicaCount` | `1` | Number of server replicas. |
| `image.repository` | `oamdev/velaux` | Image repository. |
| `image.registry` | `""` | Optional registry/hub prefix. |
| `image.tag` | `""` (chart appVersion) | Image tag. |
| `datastore.type` | `kubeapi` | `kubeapi`, `mongodb`, `postgres`, or `mysql`. |
| `datastore.database` | `""` | DB name; namespace for kubeapi type. |
| `datastore.url` | `""` | Connection URL for external datastores (credentials inline). |
| `datastore.urlExistingSecret.name` | `""` | Secret to read the connection URL from (e.g. CNPG app secret). |
| `datastore.urlExistingSecret.key` | `uri` | Key in that Secret holding the URL. |
| `datastore.cnpg.enabled` | `false` | Provision a CNPG Cluster and use it as the datastore (implies postgres). |
| `datastore.cnpg.instances` | `3` | Number of PostgreSQL instances. |
| `datastore.cnpg.database` / `.owner` | `velaux` | Database name and owner role. |
| `datastore.cnpg.storage.size` | `5Gi` | Volume size per instance. |
| `enableImpersonation` | `false` | Impersonate the login user against the K8s API. |
| `serviceAccount.name` | `kubevela-ux` | ServiceAccount name (matches the addon). |
| `rbac.create` | `true` | Create the cluster-admin ClusterRoleBinding. |
| `service.type` | `ClusterIP` | `ClusterIP`, `NodePort`, or `LoadBalancer`. |
| `service.port` | `8000` | Service port. |
| `ingress.enabled` | `false` | Create an Ingress. |

See [values.yaml](./values.yaml) for the full list.

## RBAC note

Like the official addon, this chart grants VelaUX `cluster-admin` via a `ClusterRoleBinding`
(the ServiceAccount plus the `kubevela:ux` impersonation group). VelaUX needs broad access to
manage applications across the cluster. Set `rbac.create=false` to manage permissions yourself.
