module github.com/oam-dev/velacp

go 1.16

require (
	github.com/envoyproxy/protoc-gen-validate v0.4.1
	github.com/go-errors/errors v1.1.1 // indirect
	github.com/go-git/go-billy/v5 v5.0.0
	github.com/go-git/go-git/v5 v5.2.0
	github.com/go-logr/logr v0.1.0
	github.com/go-openapi/spec v0.20.3 // indirect
	github.com/golang/protobuf v1.4.3
	github.com/golang/snappy v0.0.3 // indirect
	github.com/google/go-cmp v0.5.4
	github.com/google/uuid v1.1.2
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.2.0
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/oam-dev/kubevela v0.3.3
	github.com/onsi/ginkgo v1.13.0
	github.com/onsi/gomega v1.10.3
	github.com/pkg/errors v0.9.1
	github.com/spf13/cobra v1.1.1
	go.mongodb.org/mongo-driver v1.3.2
	go.uber.org/zap v1.15.0
	golang.org/x/net v0.0.0-20210226172049-e18ecbb05110 // indirect
	google.golang.org/genproto v0.0.0-20210207032614-bba0dbe2a9ea
	google.golang.org/grpc v1.35.0
	google.golang.org/protobuf v1.25.0
	gopkg.in/yaml.v2 v2.4.0
	k8s.io/apimachinery v0.18.8
	k8s.io/client-go v12.0.0+incompatible
	sigs.k8s.io/controller-runtime v0.6.2
	sigs.k8s.io/kustomize/api v0.8.4
	sigs.k8s.io/kustomize/kyaml v0.10.13
)

replace (
	github.com/Azure/go-autorest => github.com/Azure/go-autorest v12.2.0+incompatible // https://github.com/kubernetes/client-go/issues/628
	// fix build issue https://github.com/docker/distribution/issues/2406
	github.com/docker/distribution => github.com/docker/distribution v0.0.0-20191216044856-a8371794149d
	github.com/docker/docker => github.com/moby/moby v17.12.0-ce-rc1.0.20200618181300-9dc6525e6118+incompatible

	// kustomize issue: https://github.com/kubernetes-sigs/kustomize/issues/3443
	github.com/go-openapi/spec => github.com/go-openapi/spec v0.19.3
	github.com/wercker/stern => github.com/oam-dev/stern v1.13.0-alpha
	// fix build issue https://github.com/ory/dockertest/issues/208
	golang.org/x/sys => golang.org/x/sys v0.0.0-20200826173525-f9321e4c35a6
	// clint-go had a buggy release, https://github.com/kubernetes/client-go/issues/749
	k8s.io/client-go => k8s.io/client-go v0.18.8
)
