package services

import (
	"github.com/labstack/echo/v4"
	"github.com/oam-dev/velacp/pkg/datastore/storeadapter"
	"github.com/oam-dev/velacp/pkg/log"
	"github.com/oam-dev/velacp/pkg/proto/model"
	"net/http"
)

type CapabilityService struct {
	store storeadapter.CapabilityStore
}

func NewCapabilityService(store storeadapter.CapabilityStore) *CapabilityService {
	return &CapabilityService{
		store: store,
	}
}

func (s *CapabilityService) ListCapabilities(c echo.Context) error {
	var capabilities []*model.Capability
	var err error
	if q := c.QueryParam("catalogName"); q != "" {
		capabilities, err = s.store.ListCapabilitiesByCatalog(q)
	} else {
		capabilities, err = s.store.ListCapabilities()
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.CapabilityListResponse{Capabilities: capabilities})
}

func (s *CapabilityService) GetCapability(c echo.Context) error {
	capabilityName := c.Param("capabilityName")
	capability, err := s.store.GetCapability(capabilityName)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, model.CapabilityResponse{Capability: capability})
}

// InstallCapability installs a capability into a cluster
//
// TODO: implement this method,
// install logic is same as the `vela` cli, we should find a way to reuse these code:
// https://github.com/oam-dev/kubevela/blob/9a10e967eec8e42a8aa284ddb20fde204696aa69/references/common/capability.go#L88
func (s *CapabilityService) InstallCapability(c echo.Context) error {
	capabilityName := c.Param("capabilityName")
	clusterName := c.QueryParam("clusterName")

	log.Logger.Debugf("installing capability %s to cluster %s", capabilityName, clusterName)

	return c.JSON(http.StatusOK, true)
}
