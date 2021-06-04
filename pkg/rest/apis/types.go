package apis

import "github.com/oam-dev/velacp/pkg/proto/model"

type Action string

type ClusterType struct {
	Name       string `json:"name"`
	Desc       string `json:"desc,omitempty"`
	UpdateAt   int64  `json:"updateAt,omitempty"`
	Kubeconfig string `json:"kubeconfig"`
}

type CapabilityType struct {
	Name       string `json:"name"`
	Desc       string `json:"desc,omitempty"`
	Jsonschema string `json:"jsonschema"`
}

type ClusterMeta struct {
	Cluster *model.Cluster `json:"cluster"`
}

type ClustersMeta struct {
	Clusters []string `json:"clusters"`
}

type ClusterRequest struct {
	ClusterType
	Method Action `json:"method"`
}

type ClusterVelaStatus struct {
	Installed bool `json:"installed"`
}
