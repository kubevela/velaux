package scheme

import (
	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
)

var (
	MyScheme = runtime.NewScheme()
)

func init() {
	_ = clientgoscheme.AddToScheme(MyScheme)
	_ = oamcore.AddToScheme(MyScheme)
}
