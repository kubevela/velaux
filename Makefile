.PHONY: build
build:
	go build -o _bin/velacp ./cmd/velacp/main.go

.PHONY: gen-proto
gen-proto:
	protoc --go_out=. --go_opt=paths=source_relative \
        --go-grpc_out=require_unimplemented_servers=false:. --go-grpc_opt=paths=source_relative \
        pkg/proto/catalogservice/service.proto