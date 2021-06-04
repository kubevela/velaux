all: build

build: build-ui build-cp

build-ui:
	cd ui/ && yarn build &&	cd ..

build-cp:
	go build -o _bin/velacp ./cmd/velacp/main.go

build-cli:
	go build -o _bin/velactl ./cmd/velactl/main.go

proto:
	hack/gen_proto.sh

# Run tests
test: fmt vet
	go test ./pkg/... ./cmd/...

# Run go fmt against code
fmt:
	go fmt ./pkg/... ./cmd/...

# Run go vet against code
vet:
	go vet ./pkg/... ./cmd/...

reviewable: fmt vet
	go mod tidy

# Execute auto-gen code commands and ensure branch is clean.
check-diff: reviewable
	git --no-pager diff
	git diff --quiet || ($(ERR) please run 'make reviewable' to include all changes && false)
	@$(OK) branch is clean

run: build-cp
	_bin/velacp server \
		--db-url=${MONGO_URL} \
		--db-name=vela
