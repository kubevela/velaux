# How to Develop UI Components

## Preparation

- Install [yarn](https://yarnpkg.com/)

## Development

The UI code is under ui/ . First, go to the folder:

```
cd ui/
```

Developing UI components in velacp has a well-defined architecture and systematic process. We will walk through the steps in the following.

Let's assume we are building a new UI page "Cluster".

The process goes as:

1. In `config/routes.ts`, add your route and component.

1. Add a new component in src/pages/:

   ```
   mkdir src/pages/Cluster/
   ```

   Develop and add your component code there.

1. For remote services, create interfaces in `services/kubevela`:

   ```
   touch clusterapi.ts
   ```

   Add your API calls there:

   ```js
   import { request } from "umi";

   export async function listClusterNames() {
   return request<{ clusters: string[] }>('/api/clusternames');
   }

   ```

   For API types, define in `src/services/kubevela/typings.d.ts`:

   ```js
   declare namespace API {
    export type ApplicationType = {
      name: string;
      desc?: string;
      updatedAt?: number; // unix milliseconds

      components?: ComponentType[];
    };
   }
   ```

   They should belong to API global namespace.

1. To mock the backend APIs, create mock servers in `mock/`:

   ```
   touch mock/cluster.tx
   ```

   Expose the mock services:

   ```js
   export default {
     "GET /api/clusternames": getClusterNames,
     "GET /api/clusters": getClusters,
     "POST /api/clusters": postClusters,
   };
   ```

1. Run the UI to see the result:

   ```bash
   # run `yarn` first if you haven't installed dependencies
   yarn start
   ```
