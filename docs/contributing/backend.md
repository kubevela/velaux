# How to Develop Backend Services

## Preparation

- Install [go](https://golang.org/dl/)
- Install [yarn](https://yarnpkg.com/)
- Install [protoc](https://grpc.io/docs/protoc-installation/) and [protoc-gen-go](https://grpc.io/docs/languages/go/quickstart/#prerequisites)
- Install [mongodb](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/#install-mongodb-community-edition)

## Development

In [frontend development](./frontend.md), developers will use mock backend services first.
But eventually the production rollout of velacp will have both frontend and backend services served.

Developing backend services in velacp has a well-defined architecture and systematic process. We will walk through the steps in the following.

Let's assume we are building a new service "Cluster".

The process goes as:

1. All public APIs, including records stored in database, should be defined in protobuf. In `pkg/proto/`, add a new protobuf definition:

   ```
   touch pkg/proto/cluster.proto
   ```

   Add definitions for cluster service API types:

   ```protobuf
   message Cluster {
     string name = 1;
     ...
   }
   ```

1. Generate go code:

   ```
   make proto
   ```

1. Add the service endpoints. First create a new service in `pkg/rest/services/`:

   ```
   touch pkg/rest/services//cluster.go
   ```

   Implement the services:

   ```go
   type ClusterService struct {
     ...
   }

   func NewClusterService(store storeadapter.ClusterStore) *ClusterService {
     return &ClusterService{
       ...
     }
   }

   func (s *ClusterService) GetClusters(c echo.Context) error {
     ...
   }
   ```

   The new service needs to be registered to in `pkg/rest/rest_server.go`:

   ```go
   func (s *restServer) registerServices() {
     ...
     clusterService := services.NewClusterService(storeadapter.NewClusterStore(s.ds))
     s.server.GET("/api/clusters", clusterService.GetClusters)
   }
   ```

1. There is a generic datastore interface defined in `pkg/datastore/datastore.go`. Its mongo backend is implemented in `pkg/datastore/mongodb/mongodb.go`. For each service, you will implement a more specific store adapter to handle its own types and special logic, e.g. ClusterStore.

   All specific store adapter is defined in `pkg/datastore/storeadapter/`. Create one for ClusterStore:

   ```
   touch pkg/datastore/storeadapter/clusterstore.go
   ```

   We can see its interface:

   ```go
   type ClusterStore interface {
     PutCluster(cluster *model.Cluster) error
     ListClusters() ([]*model.Cluster, error)
     DelCluster(name string) error
   }
   ```

   Its returned model, i.e. `model.Cluster`, is defined in the `pkg/proto/model/cluster.proto`.

1. Once the code is done, build it:

   ```
   make build
   ```

   This will include the frontend as well.

1. Start [mongodb](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/#run-mongodb-community-edition).
   Ensure env `MONGO_URL` is set, e.g. "127.0.0.1:27017".

1. Start velacp:

   ```bash
   _bin/velacp server \
     --db-url=${MONGO_URL} \
     --db-name=vela
   ```

   You can now test the APIs and UIs.
