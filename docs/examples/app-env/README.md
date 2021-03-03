# Application Creation Workflow

## Setting up environments

This involves creating custom resources of:

- Cluster
- Environment
- App template

Before running the below command, please fill in your kubeconfig into `setup/cluster.yaml` .

Run:
```shell
kubectl apply -f ./setup/ --validate=false
```

## Create the application from the template

This will load an app template and bind it to an environment to form the final application deployment manifests.

Run:
```shell
kubectl apply -f ./app.yaml
```
