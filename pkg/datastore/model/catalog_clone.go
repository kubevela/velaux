package model

import "google.golang.org/protobuf/proto"

func (x *Catalog) Clone() *Catalog {
	return proto.Clone(x).(*Catalog)
}

func (x *Module) Clone() *Module {
	return proto.Clone(x).(*Module)
}

func (x *Package) Clone() *Package {
	return proto.Clone(x).(*Package)
}

func (x *PackageVersion) Clone() *PackageVersion {
	return proto.Clone(x).(*PackageVersion)
}
