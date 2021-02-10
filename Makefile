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
		-I ${GOPATH}/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis \
		--go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=require_unimplemented_servers=false:. --go-grpc_opt=paths=source_relative \
		--validate_out="lang=go:." --validate_opt=paths=source_relative \
		--grpc-gateway_out . \
			--grpc-gateway_opt logtostderr=true \
			--grpc-gateway_opt paths=source_relative \
			--grpc-gateway_opt generate_unbound_methods=true \
		pkg/proto/catalogservice/service.proto \
		pkg/proto/clusterservice/service.proto \
		pkg/datastore/model/catalog.proto \
		pkg/datastore/model/cluster.proto
