package model

import "google.golang.org/protobuf/proto"

func (x *Environment) Clone() *Environment {
	return proto.Clone(x).(*Environment)
}
