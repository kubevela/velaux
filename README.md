# velacp

KubeVela control plane to manage hybrid multi-cloud clusters,
provide plug-and-play capability management,
create stream-line application delivery pipelines.

## Architecture

This project is based on the following tech stacks:

- [Protobuf](https://developers.google.com/protocol-buffers/docs/gotutorial)
- Go & [Echo](https://echo.labstack.com/)
- React & Ant Design Pro
- Mongodb

![alt](docs/images/velacp-arch.png)

## Quickstart

Build cli and server binaries:

```
mkdir -p _bin/
make
```

Setup a mongodb instance. Check the [official doc](https://docs.mongodb.com/guides/server/install/).

Start velacp server:

```bash
_bin/velacp server \
    --db-url=${MONGO_URL} \
    --db-name=vela
```

The dashboard will be served at http://localhost:8000 .

### Cluster

![alt](docs/images/cluster-list.png)
![alt](docs/images/cluster-detail.png)

### Application

![alt](docs/images/app-list.png)
![alt](docs/images/app-input.png)
![alt](docs/images/app-detail.png)

