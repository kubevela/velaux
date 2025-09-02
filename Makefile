include makefiles/const.mk
include makefiles/build.mk

all: docker-build

.PHONY: golangci
golangci:
ifeq ($(shell $(GLOBAL_GOLANGCILINT) version --format short), $(GOLANGCILINT_VERSION))
	@$(OK) golangci-lint is already installed
GOLANGCILINT=$(GLOBAL_GOLANGCILINT)
else ifeq ($(shell $(GOBIN_GOLANGCILINT) version --format short), $(GOLANGCILINT_VERSION))
	@$(OK) golangci-lint is already installed
GOLANGCILINT=$(GOBIN_GOLANGCILINT)
else
	@{ \
	set -e ;\
	echo 'installing golangci-lint-$(GOLANGCILINT_VERSION)' ;\
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(GOBIN) v$(GOLANGCILINT_VERSION) ;\
	echo 'Successfully installed' ;\
	}
GOLANGCILINT=$(GOBIN)/golangci-lint
endif

.PHONY: staticchecktool
staticchecktool:
ifeq (, $(shell which staticcheck))
	@{ \
	set -e ;\
	echo 'installing honnef.co/go/tools/cmd/staticcheck ' ;\
	go install honnef.co/go/tools/cmd/staticcheck@v0.5.1 ;\
	}
STATICCHECK=$(GOBIN)/staticcheck
else
STATICCHECK=$(shell which staticcheck)
endif

.PHONY: goimports
goimports:
ifeq (, $(shell which goimports))
	@{ \
	set -e ;\
	go install golang.org/x/tools/cmd/goimports@6546d82b229aa5bd9ebcc38b09587462e34b48b6 ;\
	}
GOIMPORTS=$(GOBIN)/goimports
else
GOIMPORTS=$(shell which goimports)
endif

.PHONY: e2e-setup-core
e2e-setup-core: install-vela install-core install-addon

.PHONY: install-vela
install-vela: 
	curl -fsSl https://kubevela.io/script/install.sh | bash -s v1.10.3
install-core:
	vela install -v v1.9.2 -y
install-addon:
	vela addon enable fluxcd
	vela addon enable vela-workflow version="0.6.0" --override-definitions
	kubectl wait --for=condition=Ready pod -l app=source-controller -n flux-system --timeout=600s
	kubectl wait --for=condition=Ready pod -l app=helm-controller -n flux-system --timeout=600s
	kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=vela-workflow -n vela-system --timeout=600s

start-addon-mock-server:
	go run ./e2e-test/addon &

load-image:
	k3d image import oamdev/velaux:latest || { echo >&2 "kind not installed or error loading image: $(VELA_CORE_TEST_IMAGE)"; exit 1; }

enable-addon-no-replicas:
	vela addon enable ./addon replicas=0

enable-addon:
	vela addon enable ./addon

.PHONY: e2e-server-test
e2e-server-test:
	go test -v -coverpkg=./... -coverprofile=/tmp/e2e_apiserver_test.out ./e2e-test
	@$(OK) tests pass

unit-test-server:
	@$(INFO) Running server unit tests
	# Run non-service packages with go test in parallel for speed
	go test -gcflags=all=-l -coverprofile=coverage-other.txt $$(go list ./pkg/... ./cmd/... | grep -v pkg/server/domain/service)
	# Run the service package with go test -p 1 for serial execution
	# The Ordered decorator within Ginkgo v2 will ensure proper test ordering within suites
	go test -gcflags=all=-l -coverprofile=coverage-service.txt -v -p 1 ./pkg/server/domain/service
	# Merge coverage files
	echo "mode: set" > coverage.txt
	tail -n +2 coverage-other.txt >> coverage.txt || true
	tail -n +2 coverage-service.txt >> coverage.txt || true
	rm -f coverage-other.txt coverage-service.txt
	@$(OK) Server unit tests completed

# Test database management
.PHONY: test-db-up
test-db-up:
	@$(INFO) Starting test databases with docker-compose
	docker-compose -f docker-compose.test.yml up -d
	@$(INFO) Waiting for databases to be ready...
	@sleep 5
	@docker-compose -f docker-compose.test.yml ps
	@$(OK) Test databases are running

.PHONY: test-db-down
test-db-down:
	@$(INFO) Stopping test databases
	docker-compose -f docker-compose.test.yml down -v
	@$(OK) Test databases stopped

.PHONY: test-db-logs
test-db-logs:
	docker-compose -f docker-compose.test.yml logs -f

setup-test-server:
	curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(shell go env GOOS)/$(shell go env GOARCH)
	chmod +x kubebuilder
	sudo mv kubebuilder /usr/local/bin/
	go install sigs.k8s.io/controller-runtime/tools/setup-envtest@latest
	${eval OUTPUT = $(shell ${GOBIN}/setup-envtest --bin-dir /tmp use)}
	${eval BIN_PATH=$(lastword $(subst Path:, ,${OUTPUT}))}
	sudo mkdir -p /usr/local/kubebuilder/bin
	sudo mv ${BIN_PATH}/* /usr/local/kubebuilder/bin

build-swagger:
	go run ./cmd/server/main.go build-swagger ./docs/apidoc/swagger.json

lint: golangci
	@$(INFO) lint
	@$(GOLANGCILINT) run --timeout 5m

vet:
	@$(INFO) go vet
	@go vet $(shell go list ./...)

fmt: goimports
	go fmt ./...
	$(GOIMPORTS) -local github.com/kubevela/velaux -w $$(go list -f {{.Dir}} ./...)

staticcheck: staticchecktool
	@$(INFO) staticcheck
	@$(STATICCHECK) $(shell go list ./...)
mod:
	go mod tidy
reviewable: mod fmt vet staticcheck lint

# Execute auto-gen code commands and ensure branch is clean.
check-diff: reviewable
	git --no-pager diff
	git diff --quiet || ($(ERR) please run 'make reviewable' to include all changes && false)
	@$(OK) branch is clean

run-server:
	go run ./cmd/server/main.go

build-ui:
	@$(INFO) Building UI
	yarn build

build-test-image: build-ui
	@$(INFO) Building image
	docker build -t velaux:latest -f Dockerfile.local .