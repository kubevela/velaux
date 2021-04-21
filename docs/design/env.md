# Environment

User scenarios:

- Users want to define base application template and add patches based on environment. For example, in dev environment users would use ephemeral disk, while in prod environment use persistent volumes.
- Users want to define environments as the shared-bases for applications. For example, applications might need shared definitions, secrets, health checks, network gateways, etc.

To support the above scenarios, we will add the following concepts:

- AppTemplate that defines the template base as well as the env-based patches:

  ```yaml
  name: example-app-template

  base: # the base template
    components:
      - name: backend
        settings:
          cmd:
            - /bin/myservice
        traits:
          - name: logging
            properties:
              rotate: 1d
  patch: # kustomize-style overlay patch to base template based on env matching
    - envs:
        - dev # the name of the Environment
      components:
        - name: backend
          settings:
            image: dev/myimage
          traits:
            - name: scaler
              properties:
                replicas: 1
    - envs:
        - prod-beijing
        - prod-shenzhen
      components:
        - name: backend
          settings:
            image: production/myimage
          traits:
            - name: scaler
              properties:
                replicas: 10
  ```

- Environment that defines a shared-base for applications:

  ```yaml
  name: prod

  clusters: # deploy to the following clusters
    - prod-cluster

  secrets: # The secrets that will be created for applications if not existed.
    - name: redis
      data:
        url: redis-url
        password: redis-password

  definitions: # The definitions that will be created for applications if not existed.
    - type: Component
      name: function
      source:
        git: catalog-url
        path: pacakge/function
    - type: Trait
      name: logging
      source:
        git: catalog-url
        path: package/logging
  ```

  > Note: we will define a definition catalog/package format: https://github.com/hongchaodeng/catalog-example

With the above concepts, the user story goes as:

- The operations/admin team sets up environments first
- The developer users prepare app templates and individual patches for each environment that will have apps to deploy to.
- Users choose a template, then choose an environment, and deploy!
  - velacp will render the final Application based on the template and env
  - velacp will prepare the necessary secrets, definitions in the environment for the applications
  - The Application can use any of the definitions, secrets in this env.

```
Applicaton deployment workflow:

Env -> Controller -> (Secrets + Definitions)
AppTemplate + Env -> velacp -> Application -> Controller
```

Notes:

- AppTemplate will be implemented in velacp. Environment will be implemented as a CRD.
