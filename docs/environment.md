# Environment

An environment is a shared base consisting of the same configuration, clusters, packages (equiv. capabilities)
to which the applications to deploy.

Below are two examples of `staging` and `prod` environments:

```yaml
name: staing

clusters:
  - name: prod-cluster

packages:
  - catalog: staging-catalog
    package: in-mem-logging

---

name: production

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
patch: # strategic merge patch to the components based on env
  - env: staging
    components:
      - name: backend
        settings:
          image: staging/myimage
        traits:
          - name: autoscaling
            properties:
              max: 1
  - env: prod
    components:
      - name: backend
        settings:
          image: production/myimage
        traits:
          - name: autoscaling
            properties:
              min: 1
              max: 10

```