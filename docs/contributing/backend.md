# How to Develop Backend Services

## Preparation

- Install [go](https://golang.org/dl/)
- Install [protoc](https://grpc.io/docs/protoc-installation/)
- Install [protoc-gen-validate](https://github.com/envoyproxy/protoc-gen-validate)
- Install [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway)
- Setup [mongodb](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/#run-mongodb-community-edition)
  - Ensure env `MONGO_URL` is set, e.g. "127.0.0.1:27017".

## Development

In [frontend development](./frontend.md), developers will use mock backend services first.
But eventually the production rollout of velacp will have both frontend and backend services served.

Developing backend services in velacp has a well-defined architecture and systematic process. We will walk through the steps in the following.

Let's assume we are building a new service "Cluster".

The process goes as:

1. In `pkg/proto/`, add a new folder for the new service:

   ```
   mkdir pkg/proto/clusterservice/
   ```

   The proto file must be named as:

   ```
   touch pkg/proto/clusterservice/service.proto
   ```

   Add service definitions:

   ```protobuf
   service ClusterService {
    rpc PutCluster(PutClusterRequest) returns (PutClusterResponse) {
      option (google.api.http) = {
        post: "/api/catalogs"
      };}
    rpc ListClusters(ListClustersRequest) returns (ListClustersResponse) {
      option (google.api.http) = {
        get: "/api/catalogs"
      };
    }
    rpc DelCluster(DelClusterRequest) returns (DelClusterResponse) {
      option (google.api.http) = {
        delete: "/api/catalogs"
      };
    }
   }
   ```

1. Generate go code:

   ```
   make proto
   ```

   You should see the following files generated in `pkg/proto/clusterservice/`:

   ```
   pkg/proto/clusterservice
   ├── service.pb.go
   ├── service.pb.gw.go
   ├── service.pb.validate.go
   ├── service.proto
   └── service_grpc.pb.go
   ```

1. Then Implement the server stubs. First create a new file in `pkg/grpcapi/services/`:

   ```
   touch pkg/grpcapi/services/cluster.go
   ```

   Implement the server stubs:

   ```go
   func (s *ClusterService) ListClusters(ctx context.Context, request *clusterservice.ListClustersRequest) (*clusterservice.ListClustersResponse, error) {
    clusters, err := s.store.ListClusters(ctx)
    if err != nil {
      return nil, err
    }
    return &clusterservice.ListClustersResponse{
      Clusters: clusters,
    }, nil
   }
   ```

   The new service needs to be registered to grpcServer in `pkg/grpcapi/grpcapi.go`:

   ```go
   func (s *grpcServer) registerServices() {
     clusterservice.RegisterClusterServiceServer(s.server, services.NewClusterService(datastore.NewClusterStore(s.ds), s.Logger))
     ...
   }
   ```

1. There is a generic datastore interface defined in `pkg/datastore/datastore.go`. Its mongo backend is implemented in `pkg/datastore/mongodb/mongodb.go`. For each service, you will implement a more specific store adapter to handle its own types and special logic, e.g. ClusterStore in above example.

   All specific store adapter is defined in `pkg/datastore/storeadapter/`. Create one for ClusterStore:

   ```
   touch pkg/datastore/storeadapter/clusterstore.go
   ```

   We can see its interface:

   ```go
   type ClusterStore interface {
     PutCluster(ctx context.Context, cluster *model.Cluster) error
     ListClusters(ctx context.Context) ([]*model.Cluster, error)
     GetCluster(ctx context.Context, name string) (*model.Cluster, error)
     DelCluster(ctx context.Context, name string) error
   }
   ```

   Its returned model, in this case `model.Cluster` is defined in `pkg/datastore/model/` as a protobuf definition:

   ```
   touch pkg/datastore/model/cluster.proto
   ```

1. Once the code is done, build it:

   ```
   make build
   ```

   This will include the frontend as well.

1. Start mongodb

1. Start velacp:

   ```bash
   _bin/velacp server \
     --db-url=${MONGO_URL} \
     --db-name=vela
   ```

   You can now test the APIs and UIs.
