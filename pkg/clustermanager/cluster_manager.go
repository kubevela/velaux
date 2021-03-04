package clustermanager

import (
	"k8s.io/client-go/tools/clientcmd"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/oam-dev/velacp/pkg/scheme"
)

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
	return client.New(restConfig, client.Options{Scheme: scheme.MyScheme})
}
