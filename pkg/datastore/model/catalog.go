package model

import "google.golang.org/protobuf/proto"

func (x *Catalog) Clone() *Catalog {
	return proto.Clone(x).(*Catalog)
}

func (x *Module) Clone() *Module {
	return proto.Clone(x).(*Module)
}
