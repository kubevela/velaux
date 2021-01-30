.PHONY: build
build: build-cp build-cli

.PHONY: build-cp
build-cp:
	go build -o _bin/velacp ./cmd/velacp/main.go

.PHONY: build-cli
build-cli:
	go build -o _bin/velactl ./cmd/velactl/main.go

.PHONY: gen-proto
gen-proto:
	protoc \
		-I . \
		-I ${GOPATH}/src/github.com/envoyproxy/protoc-gen-validate \
		--go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=require_unimplemented_servers=false:. --go-grpc_opt=paths=source_relative \
		--validate_out="lang=go:." --validate_opt=paths=source_relative \
		pkg/proto/catalogservice/service.proto \
		pkg/datastore/model/catalog.proto
