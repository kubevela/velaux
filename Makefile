# VelaCP version
VELA_CP_VERSION ?= master
# Repo info
GIT_COMMIT      ?= git-$(shell git rev-parse --short HEAD)

ERR		= echo ${TIME} ${RED}[FAIL]${CNone}
OK		= echo ${TIME} ${GREEN}[ OK ]${CNone}

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

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

reviewable: fmt vet lint staticcheck
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

staticcheck: staticchecktool
	$(STATICCHECK) ./...

lint: golangci
	$(GOLANGCILINT) run ./...

GOLANGCILINT_VERSION ?= v1.31.0

golangci:
ifeq (, $(shell which golangci-lint))
	@{ \
	set -e ;\
	echo 'installing golangci-lint-$(GOLANGCILINT_VERSION)' ;\
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(GOBIN) $(GOLANGCILINT_VERSION) ;\
	echo 'Install succeed' ;\
	}
GOLANGCILINT=$(GOBIN)/golangci-lint
else
GOLANGCILINT=$(shell which golangci-lint)
endif

.PHONY: staticchecktool
staticchecktool:
ifeq (, $(shell which staticcheck))
	@{ \
	set -e ;\
	echo 'installing honnef.co/go/tools/cmd/staticcheck ' ;\
	GO111MODULE=off go get honnef.co/go/tools/cmd/staticcheck ;\
	}
STATICCHECK=$(GOBIN)/staticcheck
else
STATICCHECK=$(shell which staticcheck)
endif
