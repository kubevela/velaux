# Environment

An environment is a shared base consisting of the same configuration, clusters, packages (equiv. capabilities)
to which the applications to deploy.

Below are two examples of `staging` and `prod` environments:

```yaml
name: staing

config:
  patch: # strategic merge patch to the components field of Application 
    - name: backend
      settings:
        image: staging/myimage
      traits:
        - name: autoscaling
          properties:
            max: 1

clusters:
  - name: prod-cluster

packages:
  - catalog: staging-catalog
    package: in-mem-logging

---

name: production

config:
  patch: # strategic merge patch to the components field of Application 
    - name: backend
      settings:
        image: production/myimage
      traits:
        - name: autoscaling
          properties:
            min: 1
            max: 10

clusters:
  - name: staging-cluster

packages:
  - catalog: production-catalog
    package: loki-logging
```

Assume we are deploying the following application:

```yaml
name: example-app
env: staging | prod
components:
- name: backend
  settings:
    cmd:
      - /bin/myservice
  traits:
    - name: logging
      properties:
        rotate: 1d
```