# How to Develop Backend Services

## Preparation

- Install [go](https://golang.org/dl/)
- Install [protoc](https://grpc.io/docs/protoc-installation/)
- Install [protoc-gen-validate](https://github.com/envoyproxy/protoc-gen-validate)
- Install [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway)
- Setup [mongodb](https://www.mongodb.com/)
  - Make sure these envs are ready: `MONGO_URL`, `MONGO_USER`, `MONGO_PASSWORD`

## Development

In [frontend development](./frontend.md), developers will use mock APIs first.
The production rollout of velacp will have both frontend and backend APIs served.

Developing backend APIs in velacp has a well-defined architecture and systematic process. We will walk through the steps in the following.

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

   The new service needs to be registered to grpcServer in `pkg/grpcapi/grpcapi.go`:

   ```go
   func (s *grpcServer) registerServices() {
     clusterservice.RegisterClusterServiceServer(s.server, services.NewClusterService(datastore.NewClusterStore(s.ds), s.Logger))
     ...
   }
   ```

1. You might notice in previous step there is a ClusterStore object. There is a generic datastore interface defined in `pkg/datastore/datastore.go`. Its mongo backend is implemented in `pkg/datastore/mongodb/mongodb.go`. For each service, you will implement a more specific store to handle its own types and special logic. In this case it is the ClusterStore.

1. Once the code is done, build it:

   ```
   make build
   ```

   This will include the frontend as well.

1. Start mongodb.

1. Start velacp:

   ```
   _bin/velacp server \
     --db-address=${MONGO_URL} \
     --db-user=${MONGO_USER} \
     --db-password=${MONGO_PASSWORD}
     --db-name=vela \
   ```

   You can now test the APIs and UIs.
