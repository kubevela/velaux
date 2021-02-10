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
	hack/gen_proto.sh
