# VelaCP version
VELA_CP_VERSION ?= master
# Repo info
GIT_COMMIT      ?= git-$(shell git rev-parse --short HEAD)

ERR		= echo ${TIME} ${RED}[FAIL]${CNone}
OK		= echo ${TIME} ${GREEN}[ OK ]${CNone}

PROJECT_VERSION_VAR    := github.com/oam-dev/velacp/pkg/version.Version
PROJECT_GITVERSION_VAR := github.com/oam-dev/velacp/pkg/version.GitRevision
LDFLAGS             ?= "-X $(PROJECT_VERSION_VAR)=$(PROJECT_VERSION) -X $(PROJECT_GITVERSION_VAR)=$(GIT_COMMIT)"

GOX         = go run github.com/mitchellh/gox
TARGETS     := darwin/amd64 linux/amd64 windows/amd64
DIST_DIRS   := find * -name "*-*" -type d -exec

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

all: build

build: build-ui build-cp

build-ui:
	cd ui/ && yarn install && yarn build && cd ..

build-cp:
	go build -o _bin/velacp ./cmd/velacp/main.go

build-cli:
	go build -o _bin/velactl ./cmd/velactl/main.go

cross-build:
	GO111MODULE=on CGO_ENABLED=0 $(GOX) -ldflags $(LDFLAGS) -parallel=2 -output="_bin/{{.OS}}-{{.Arch}}/velacp" -osarch="$(TARGETS)" ./cmd/velacp/

compress:
	( \
		echo "\n## Release Info\nVERSION: $(PROJECT_VERSION)" >> README.md && \
		echo "GIT_COMMIT: $(GIT_COMMIT_LONG)\n" >> README.md && \
		cd _bin && \
		mkdir ui && \
		cp -r ../ui/dist ui && \
		$(DIST_DIRS) cp -r ui {} \; && \
		$(DIST_DIRS) cp ../LICENSE {} \; && \
		$(DIST_DIRS) cp ../README.md {} \; && \
		$(DIST_DIRS) tar -zcf velacp-{}.tar.gz {} \; && \
		$(DIST_DIRS) zip -r velacp-{}.zip {} \; && \
		sha256sum velacp-* > sha256sums.txt \
	)

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
