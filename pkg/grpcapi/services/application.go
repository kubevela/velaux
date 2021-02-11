package services

import (
	"context"
	"time"

	"go.uber.org/zap"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/proto/appservice"
)

var _ appservice.ApplicationServiceServer = &AppService{}

type AppService struct {
	store  datastore.ApplicationStore
	logger *zap.Logger
}

func NewAppService(store datastore.ApplicationStore, l *zap.Logger) *AppService {
	s := &AppService{
		store:  store,
		logger: l,
	}
	return s
}

func (s *AppService) PutApplication(ctx context.Context, request *appservice.PutApplicationRequest) (*appservice.PutApplicationResponse, error) {
	e := request.App.Clone()
	e.UpdatedAt = time.Now().Unix()

	err := s.store.PutApplication(ctx, e)
	if err != nil {
		return nil, err
	}
	return &appservice.PutApplicationResponse{}, nil
}

func (s *AppService) GetApplication(ctx context.Context, request *appservice.GetApplicationRequest) (*appservice.GetApplicationResponse, error) {
	app, err := s.store.GetApplication(ctx, request.Name)
	if err != nil {
		return nil, err
	}

	return &appservice.GetApplicationResponse{
		App: app,
	}, nil
}

func (s *AppService) ListApplications(ctx context.Context, request *appservice.ListApplicationsRequest) (*appservice.ListApplicationsResponse, error) {
	apps, err := s.store.ListApplications(ctx)
	if err != nil {
		return nil, err
	}
	return &appservice.ListApplicationsResponse{
		Apps: apps,
	}, nil
}

func (s *AppService) DelApplication(ctx context.Context, request *appservice.DelApplicationRequest) (*appservice.DelApplicationResponse, error) {
	err := s.store.DelApplication(ctx, request.Name)
	if err != nil {
		return nil, err
	}
	return &appservice.DelApplicationResponse{}, nil
}
