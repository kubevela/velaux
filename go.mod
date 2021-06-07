module github.com/oam-dev/velacp

go 1.16

require (
	cuelang.org/go v0.2.2
	github.com/bugsnag/bugsnag-go v1.0.5-0.20150529004307-13fd6b8acda0 // indirect
	github.com/docker/libtrust v0.0.0-20160708172513-aabc10ec26b7 // indirect
	github.com/getkin/kin-openapi v0.34.0
	github.com/ghodss/yaml v1.0.0
	github.com/gofrs/flock v0.7.1
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/labstack/echo/v4 v4.2.2
	github.com/niemeyer/pretty v0.0.0-20200227124842-a10e7caefd8e // indirect
	github.com/oam-dev/kubevela v1.0.5
	github.com/pkg/errors v0.9.1
	github.com/spf13/cobra v1.1.1
	github.com/xdg/stringprep v1.0.0 // indirect
	go.mongodb.org/mongo-driver v1.3.2
	go.uber.org/zap v1.16.0
	golang.org/x/crypto v0.0.0-20210421170649-83a5a9bb288b // indirect
	golang.org/x/sys v0.0.0-20210421221651-33663a62ff08 // indirect
	golang.org/x/text v0.3.6 // indirect
	golang.org/x/tools v0.0.0-20210106214847-113979e3529a // indirect
	google.golang.org/protobuf v1.26.0
	gopkg.in/check.v1 v1.0.0-20200227125254-8fa46927fb4f // indirect
	helm.sh/helm/v3 v3.2.4
	honnef.co/go/tools v0.0.1-2020.1.5 // indirect
	k8s.io/api v0.18.8
	k8s.io/apiextensions-apiserver v0.18.6
	k8s.io/apimachinery v0.18.8
	k8s.io/cli-runtime v0.18.6
	k8s.io/client-go v12.0.0+incompatible
	k8s.io/klog/v2 v2.4.0
	rsc.io/letsencrypt v0.0.3 // indirect
	sigs.k8s.io/controller-runtime v0.6.2
)

replace k8s.io/client-go => k8s.io/client-go v0.18.8
