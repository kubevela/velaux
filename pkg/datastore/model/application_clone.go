package model

import "google.golang.org/protobuf/proto"

func (x *Application) Clone() *Application {
	return proto.Clone(x).(*Application)
}
