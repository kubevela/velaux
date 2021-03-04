# Environment

An environment is a shared infra-base consisting of the same clusters, packages (equiv. capabilities), etc.
to which the applications are deployed.

Below are two examples of `staging` and `prod` environments:

```yaml
name: staging

clusters:
  - name: staging-cluster

packages:
  - catalog: staging-catalog
    package: in-mem-logging

---

name: prod

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

## Packages

Within an environment, deployment on all clusters should be consistent. Thus, all capabilities should be installed the same.
To provide this guarantee, environment includes `packages` list to ensure the dependencies for application deployment are declared and consistently installed.

For more information on catalog & package, please check out [this example](https://github.com/hongchaodeng/catalog-example).
Basically, a package is an abstraction over manifests to prepare infrastructure environments. It could be Helm Charts, Kube resources, or Terraform resources. You can use it to set up Operators (Prometheus, ELK, Istio), RBAC rules, OAM Definitions, etc.

## Env-based Config Patch

You can also do per-environment configuration management based on app templates.
Check out [this doc](./env_based_patch.md)

