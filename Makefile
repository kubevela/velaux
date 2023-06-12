include makefiles/const.mk
include makefiles/build.mk

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
	go install honnef.co/go/tools/cmd/staticcheck@d7e217c1ff411395475b2971c0824e1e7cc1af98 ;\
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
	curl -fsSl https://kubevela.io/script/install.sh | bash -s v1.9.0-alpha.3
install-core:
	vela install -v v1.9.0-alpha.2 -y
install-addon:
	vela addon enable fluxcd
	vela addon enable vela-workflow --override-definitions
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
	go test -gcflags=all=-l -coverprofile=coverage.txt $(shell go list ./pkg/... ./cmd/...)

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
