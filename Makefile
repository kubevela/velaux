all: build

build: proto
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

dev: build-cp
	_bin/velacp server \
		--db-address=${MONGO_URL} \
		--db-user=${MONGO_USER} \
		--db-password=${MONGO_PASSWORD}
		--db-name=vela \
