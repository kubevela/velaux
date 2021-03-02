package clustermanager

import (
	oamcore "github.com/oam-dev/kubevela/apis/core.oam.dev"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/tools/clientcmd"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	myscheme = runtime.NewScheme()
)

func init() {
	_ = clientgoscheme.AddToScheme(myscheme)
	_ = oamcore.AddToScheme(myscheme)
}

func GetClient(kubeConfigData []byte) (client.Client, error) {
	// create restconfig
	clientConfig, err := clientcmd.NewClientConfigFromBytes(kubeConfigData)
	if err != nil {
		return nil, err
	}
	restConfig, err := clientConfig.ClientConfig()
	if err != nil {
		return nil, err
	}
	return client.New(restConfig, client.Options{Scheme: myscheme})
}
