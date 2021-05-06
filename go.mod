module github.com/oam-dev/velacp

go 1.16

require (
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/labstack/echo/v4 v4.2.2
	github.com/oam-dev/kubevela v1.0.4
	github.com/spf13/cobra v1.1.1
	github.com/xdg/stringprep v1.0.0 // indirect
	go.mongodb.org/mongo-driver v1.3.2
	go.uber.org/zap v1.16.0
	golang.org/x/crypto v0.0.0-20210421170649-83a5a9bb288b // indirect
	golang.org/x/sys v0.0.0-20210421221651-33663a62ff08 // indirect
	golang.org/x/text v0.3.6 // indirect
	golang.org/x/tools v0.0.0-20210106214847-113979e3529a // indirect
	google.golang.org/protobuf v1.26.0
	honnef.co/go/tools v0.0.1-2020.1.5 // indirect
	k8s.io/apimachinery v0.18.8
	k8s.io/client-go v12.0.0+incompatible
	sigs.k8s.io/controller-runtime v0.6.2
)

replace k8s.io/client-go => k8s.io/client-go v0.18.8
