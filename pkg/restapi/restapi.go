package restapi

import (
	"context"

	"github.com/oam-dev/velacp/pkg/datastore"
)

type RestAPIServer interface {
	Run(context.Context) error
}

type restserver struct {
	d datastore.DataStore
}

func (s *restserver) Run(context.Context) error {
	panic("")
}

func New(d datastore.DataStore) RestAPIServer {
	s := &restserver{
		d: d,
	}
	return s
}
