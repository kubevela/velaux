# Environment-Based Config Patch

Below we demonstrate how we use app templates and environments to apply per-environment deployment configuration.

Assume we have three environments:

```yaml
name: staging

clusters:
  - name: staging-cluster

---
name: prod

clusters:
  - name: prod-cluster

---
name: prod-2

clusters:
  - name: prod-2-cluster
```

Assume we have the following application template:

```yaml
name: example-app-template
template:
  components:
    - name: backend
      settings:
        cmd:
          - /bin/myservice
      traits:
        - name: logging
          properties:
            rotate: 1d
patch: # kustomize-style overlay patch to the components based on env
  - envs:
      - staging
    components:
      - name: backend
        settings:
          image: staging/myimage
        traits:
          - name: autoscaling
            properties:
              max: 1
  - envs:
      - prod
      - prod-2
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

We can use the above template to create the following application:

```yaml
name: example-app
env: prod
template: example-app-template
```

The finalized application config will be rendered like below:

```yaml
spec
  components:
    - name: backend
      settings:
        image: production/myimage
        cmd:
          - /bin/myservice
      traits:
        - name: logging
          properties:
            rotate: 1d
        - name: autoscaling
          properties:
            min: 1
            max: 10
```
