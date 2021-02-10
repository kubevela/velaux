package model

import "google.golang.org/protobuf/proto"

func (x *Cluster) Clone() *Cluster {
	return proto.Clone(x).(*Cluster)
}
