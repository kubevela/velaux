# How to build a plugin

VelUX plugin could help you customs any page applications. Most default and extensional runtime APIs make you develop the application easies.

## 1. Build the local server environment.

Refer [contributing](./docs/contributing/velaux.md) guide.

## 2. Initialize the plugin project.

```bash
mkdir custom-plugins
$pluginName=<your_plugin_name>
git clone https://github.com/kubevela-contrib/velaux-plugin-template custom-plugins/$pluginName

cd custom-plugins/$pluginName
```

## 3. Edit the plugin metadata.

* src/plugin.json: Plugin metadata, you should change it.
* package.json: Project metadata, you should change the project name, version, and description etc.

Plugin metadata spec:

```cue
{
  "type": "page-app",
  "name": string,
  "id": string,
  "info": {
    "keywords": []string,
    "description": string,
    "author": {
      "name": string
    },
    "logos": {
      "small": string,
      "large": string
    },
    "screenshots": [],
    "version": string,
    "updated": string
  },
  "backend"?: bool,
  "proxy"?: bool,
  "backendType?": "kube-api" | "kube-service",
  "routes"?: [
    {
      "path": string,
      "permission": {
        "resource": string,
        "action": string
      }
    }
  ],
  "backendService"?: {
    "name": string
    "namespace"?: string
  },
  "kubePermissions"?: [
    {
      "apiGroups": string[],
      "resources": string[],
      "verbs": string[],
    }
  ]
}
```

There are some example plugin configs. https://github.com/kubevela/velaux/tree/main/docs/plugins

## 4. Develop the plugin

```bash
yarn install
yarn dev
```

### Request the backend API

```js
import { getBackendSrv } from '@velaux/ui';

// Request the core APIs
getBackendSrv().get('/api/v1/clusters').then(res=>{console.log(res)})

// Request the plugin proxy APIs
getBackendSrv().get(`/proxy/plugins/${pluginID}/${realPath}`).then(res=>{console.log(res)})

```

Core API Reference: https://kubevela.net/docs/platform-engineers/openapi/overview

### UI Components

```js
import { Table, Form } from '@velaux/ui';
```

UI Component Reference: https://fusion.design/pc/component/box?themeid=2

## 5. Start the server to debug the plugin

```bash
go run ./cmd/server/main.go --plugin-path <custom-plugins-path>
```
