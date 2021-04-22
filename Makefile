all: build

build: build-ui build-cp

build-ui:
	cd ui/ && yarn build &&	cd ..

build-cp: proto
	go build -o _bin/velacp ./cmd/velacp/main.go

build-cli:
	go build -o _bin/velactl ./cmd/velactl/main.go

proto:
	hack/gen_proto.sh

# Run tests
test: proto fmt vet
	go test ./pkg/... ./cmd/...

# Run go fmt against code
fmt:
	go fmt ./pkg/... ./cmd/...

# Run go vet against code
vet:
	go vet ./pkg/... ./cmd/...

run: build
	_bin/velacp server \
		--db-url=${MONGO_URL} \
		--db-name=vela
