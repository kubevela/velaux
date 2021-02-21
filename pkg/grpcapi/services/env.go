package services

import (
	"context"
	"time"

	"go.uber.org/zap"

	"github.com/oam-dev/velacp/pkg/datastore"
	"github.com/oam-dev/velacp/pkg/proto/envservice"
)

var _ envservice.EnvServiceServer = &EnvService{}

type EnvService struct {
	store  datastore.EnvStore
	logger *zap.Logger
}

func NewEnvService(store datastore.EnvStore, l *zap.Logger) *EnvService {
	s := &EnvService{
		store:  store,
		logger: l,
	}
	return s
}

func (s *EnvService) PutEnv(ctx context.Context, request *envservice.PutEnvRequest) (*envservice.PutEnvResponse, error) {
	e := request.Env.Clone()
	e.UpdatedAt = time.Now().Unix()

	err := s.store.PutEnv(ctx, e)
	if err != nil {
		return nil, err
	}
	return &envservice.PutEnvResponse{}, nil
}

func (s *EnvService) GetEnv(ctx context.Context, request *envservice.GetEnvRequest) (*envservice.GetEnvResponse, error) {
	env, err := s.store.GetEnv(ctx, request.Name)
	if err != nil {
		return nil, err
	}

	return &envservice.GetEnvResponse{
		Env: env,
	}, nil
}

func (s *EnvService) ListEnvs(ctx context.Context, request *envservice.ListEnvsRequest) (*envservice.ListEnvsResponse, error) {
	envs, err := s.store.ListEnvs(ctx)
	if err != nil {
		return nil, err
	}
	return &envservice.ListEnvsResponse{
		Envs: envs,
	}, nil
}

func (s *EnvService) DelEnv(ctx context.Context, request *envservice.DelEnvRequest) (*envservice.DelEnvResponse, error) {
	err := s.store.DelEnv(ctx, request.Name)
	if err != nil {
		return nil, err
	}
	return &envservice.DelEnvResponse{}, nil
}

func (s *EnvService) ListCaps(ctx context.Context, request *envservice.ListCapsRequest) (*envservice.ListCapsResponse, error) {
	return &envservice.ListCapsResponse{}, nil
}
