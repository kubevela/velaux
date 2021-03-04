# Environment

An environment is a shared infra-base consisting of the same clusters, packages (equiv. capabilities), etc.
to which the applications are deployed.

Below are two examples of `staging-env` and `prod-env` environments:

```yaml
name: staging-env

clusters:
  - name: staging-cluster

packages:
  - catalog: staging-catalog
    package: inmem-logging

---

name: prod-env

clusters:
  - name: prod-cluster

packages:
  - catalog: prod-catalog
    package: loki-logging

```

We are going to explain what an environment includes in the following.

## Clusters

An environment consists of a group of clusters. For example, multiple small clusters from different data centers could form a staging environment to simplify management and serve maximum availability. While each production environment might consist of only one cluster and users need to calibrate high availability for their apps.

When deploying apps to an environment, you might specify only the environment which will deploy to all clusters. Or you might pick some clusters within an environment.

```yaml
# When deploying an app you could choose env and select clusters within the env.
name: example-app
env: env-1
clusters:
  - cluster-1
```

The clusters that environments reference to are abstraction over a k8s cluster. It could be an existing one which should have credentials set, or a need-to-be-created one that VelaCP can call over some cloud providers (e.g. ACK, GKE, EKS) to create one.

### Cluster Setup Workflow

Before creating any Environment, users need to create Clusters first. Here is an example:

```yaml
name: prod-cluster
spec:
  external: # This is pointing to externally managed clusters without VelaCP reconciling
    kubeconfig: "..." 
  managed: # This would trigger cluster reconciler in VelaCP to create and manage a cluster
    provider: ack
    parameters:
      master:
        instanceType: ecs.g6.large
      worker:
        instanceType: ecs.g6.small
        replicas: 3
      cni: terway
```

Once the cluster is setup, then create environments to reference it:

```yaml
name: prod-env
clusters:
  - prod-cluster
```


## Packages

Within an environment, deployment on all clusters should be consistent. Thus, all packages should be installed the same across clusters.
To provide such guarantee, environment includes `packages` list to ensure those dependencies are declared and installed consistently.

A package is an abstraction over manifests to prepare infrastructure environments. It could be Helm Charts, Kube resources, or Terraform resources. You can use it to set up Operators (Prometheus, ELK, Istio), RBAC rules, OAM Definitions, etc.

### Package Setup Workflow

First of all, the packages should be uploaded to a remote store. We support two kinds of storage backends:

- Git.
- Object storage.

The catalog and package structure must follow predefined format. Here is an example of the structure format: [catalog-example](https://github.com/hongchaodeng/catalog-example).

Before creating the Environment, create the Catalogs first. Here is an example:

```yaml
name: prod-catalog
spec:
  git:
    url: https://github.com/hongchaodeng/catalog-example
    rootdir: catalog/
  oss:
    url: https://oss.aliyun.com/bucket_name/
```

Finally create the environment:

```yaml
name: prod-env
clusters:
  - prod-cluster
packages:
  - catalog: prod-catalog
    package: grafana
```

By doing this, the environment reconciler from VelaCP would retrieve the packages from the catalog, and then:

- if the package is not installed, install the package
- if the package has been installed and version is older, upgrade the package

Note that the pacakge could be of type of Helm Chart or Kube resources or Terraform resources, no worry about that.
VelaCP will take care of them under the hood and use corresponding tooling to do the installation:

- Kube resources: same as `kubectl apply`
- Helm chart: same as `helm install`/`helm upgrade`
- Terraform resources: same as `terraform apply`

## Env-based Config Patch

You can also do per-environment configuration management based on app templates.
Check out [this doc](./env_based_patch.md)

