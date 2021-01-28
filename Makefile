.PHONY: build
build:
	go build -o _bin/velacp ./cmd/velacp/main.go

.PHONY: gen-proto
gen-proto:
	protoc --proto_path=pkg/proto --go_out=pkg/generated/pb --go_opt=paths=source_relative \
	pkg/proto/catalogservice/service.proto
