/*
Copyright 2022 The KubeVela Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strings"
	"time"

	"github.com/coreos/go-oidc"
	"github.com/form3tech-oss/jwt-go"
	"golang.org/x/oauth2"
	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/yaml"

	"github.com/oam-dev/kubevela/apis/core.oam.dev/v1beta1"
	velatypes "github.com/oam-dev/kubevela/apis/types"
	"github.com/oam-dev/kubevela/pkg/oam"

	"github.com/kubevela/velaux/pkg/server/domain/model"
	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
	apisv1 "github.com/kubevela/velaux/pkg/server/interfaces/api/dto/v1"
	apiutils "github.com/kubevela/velaux/pkg/server/utils"
	"github.com/kubevela/velaux/pkg/server/utils/bcode"
)

const (
	keyDex             = "dex"
	dexConfigName      = "dex-config"
	secretDexConfigKey = "config.yaml"
	dexAddonName       = "addon-dex"
	jwtIssuer          = "vela-issuer"
	grantMsg           = "GrantPrivileges"
	revokeMsg          = "RevokePrivileges"

	// GrantTypeAccess is the grant type for access token
	GrantTypeAccess = "access"
	// GrantTypeRefresh is the grant type for refresh token
	GrantTypeRefresh = "refresh"
)

// signedKey is the signed key of JWT
var signedKey string

// AuthenticationService is the service of authentication
type AuthenticationService interface {
	Login(ctx context.Context, loginReq apisv1.LoginRequest) (*apisv1.LoginResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*apisv1.RefreshTokenResponse, error)
	// ValidateToken returns the claims of a token of the given grant type and the user it
	// was issued to, refusing it when that user is gone or disabled or the token is revoked.
	ValidateToken(ctx context.Context, token, grantType string) (*model.CustomClaims, *model.User, error)
	// Logout ends every session of the user.
	Logout(ctx context.Context, username string) error
	GetDexConfig(ctx context.Context) (*apisv1.DexConfigResponse, error)
	GetLoginType(ctx context.Context) (*apisv1.GetLoginTypeResponse, error)
}

type authenticationServiceImpl struct {
	SysService     SystemInfoService   `inject:""`
	UserService    UserService         `inject:""`
	ProjectService ProjectService      `inject:""`
	Store          datastore.DataStore `inject:"datastore"`
	KubeClient     client.Client       `inject:"kubeClient"`
}

// NewAuthenticationService new authentication service
func NewAuthenticationService() AuthenticationService {
	return &authenticationServiceImpl{}
}

type authHandler interface {
	login(ctx context.Context) (*apisv1.UserBase, error)
}

type dexHandlerImpl struct {
	idToken           *oidc.IDToken
	Store             datastore.DataStore
	projectService    ProjectService
	systemInfoService SystemInfoService
}

type localHandlerImpl struct {
	ds          datastore.DataStore
	userService UserService
	username    string
	password    string
}

func (a *authenticationServiceImpl) newDexHandler(ctx context.Context, req apisv1.LoginRequest) (*dexHandlerImpl, error) {
	if req.Code == "" {
		return nil, bcode.ErrInvalidLoginRequest
	}
	// The stored config, not GetDexConfig's public view: the code exchange needs the secret.
	dexConfig, err := getDexConfig(ctx, a.KubeClient)
	if err != nil {
		return nil, err
	}
	dexClient := dexConfig.StaticClients[0]
	provider, err := oidc.NewProvider(ctx, dexConfig.Issuer)
	if err != nil {
		return nil, err
	}
	idTokenVerifier := provider.Verifier(&oidc.Config{ClientID: dexClient.ID})
	oauth2Config := &oauth2.Config{
		ClientID:     dexClient.ID,
		ClientSecret: dexClient.Secret,
		Endpoint:     provider.Endpoint(),
		RedirectURL:  dexClient.RedirectURIs[0],
	}
	oidcCtx := oidc.ClientContext(ctx, http.DefaultClient)
	token, err := oauth2Config.Exchange(oidcCtx, req.Code)
	if err != nil {
		return nil, err
	}
	idToken, err := idTokenVerifier.Verify(ctx, token.Extra("id_token").(string))
	if err != nil {
		return nil, err
	}
	return &dexHandlerImpl{
		idToken:           idToken,
		Store:             a.Store,
		projectService:    a.ProjectService,
		systemInfoService: a.SysService,
	}, nil
}

func (a *authenticationServiceImpl) newLocalHandler(req apisv1.LoginRequest) (*localHandlerImpl, error) {
	if req.Username == "" || req.Password == "" {
		return nil, bcode.ErrInvalidLoginRequest
	}
	return &localHandlerImpl{
		ds:          a.Store,
		userService: a.UserService,
		username:    req.Username,
		password:    req.Password,
	}, nil
}

func (a *authenticationServiceImpl) Login(ctx context.Context, loginReq apisv1.LoginRequest) (*apisv1.LoginResponse, error) {
	var handler authHandler
	var err error
	sysInfo, err := a.SysService.Get(ctx)
	if err != nil {
		return nil, err
	}
	loginType := sysInfo.LoginType

	switch {
	case loginType == model.LoginTypeDex || (loginReq.Code != "" && loginReq.Username == ""):
		handler, err = a.newDexHandler(ctx, loginReq)
		if err != nil {
			return nil, err
		}
	case loginType == model.LoginTypeLocal:
		handler, err = a.newLocalHandler(loginReq)
		if err != nil {
			return nil, err
		}
	default:
		return nil, bcode.ErrUnsupportedLoginType
	}
	userBase, err := handler.login(ctx)
	if err != nil {
		return nil, err
	}
	if userBase.Disabled {
		return nil, bcode.ErrUserAlreadyDisabled
	}
	user, err := a.UserService.GetUser(ctx, userBase.Name)
	if err != nil {
		return nil, err
	}
	accessToken, refreshToken, err := a.issueTokens(user)
	if err != nil {
		return nil, err
	}
	return &apisv1.LoginResponse{
		User:         userBase,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (a *authenticationServiceImpl) issueTokens(user *model.User) (accessToken, refreshToken string, err error) {
	if accessToken, err = a.generateJWTToken(user, GrantTypeAccess, time.Hour); err != nil {
		return "", "", err
	}
	if refreshToken, err = a.generateJWTToken(user, GrantTypeRefresh, time.Hour*24); err != nil {
		return "", "", err
	}
	return accessToken, refreshToken, nil
}

func (a *authenticationServiceImpl) generateJWTToken(user *model.User, grantType string, expireDuration time.Duration) (string, error) {
	now := time.Now()
	id := make([]byte, 16)
	if _, err := rand.Read(id); err != nil {
		return "", err
	}
	claims := model.CustomClaims{
		StandardClaims: jwt.StandardClaims{
			Id:        hex.EncodeToString(id),
			IssuedAt:  now.Unix(),
			NotBefore: now.Unix(),
			ExpiresAt: now.Add(expireDuration).Unix(),
			Issuer:    jwtIssuer,
		},
		Username:   user.Name,
		GrantType:  grantType,
		Generation: user.TokenGeneration,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(signedKey))
}

// ValidateToken returns the claims of a token of the given grant type and the user it was issued
// to. A token is accepted only while its user exists, is enabled and is at the generation the
// token was issued at.
func (a *authenticationServiceImpl) ValidateToken(ctx context.Context, token, grantType string) (*model.CustomClaims, *model.User, error) {
	claims, err := ParseToken(token)
	if err != nil {
		return nil, nil, err
	}
	if claims.GrantType != grantType {
		if grantType == GrantTypeRefresh {
			return nil, nil, bcode.ErrTokenInvalid
		}
		return nil, nil, bcode.ErrNotAccessToken
	}
	user := &model.User{Name: claims.Username}
	if err := a.Store.Get(ctx, user); err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, nil, bcode.ErrSessionEnded
		}
		return nil, nil, err
	}
	if user.Disabled || claims.Generation != user.TokenGeneration {
		return nil, nil, bcode.ErrSessionEnded
	}
	return claims, user, nil
}

// RefreshToken issues a new access token and refresh token for a valid refresh token.
func (a *authenticationServiceImpl) RefreshToken(ctx context.Context, refreshToken string) (*apisv1.RefreshTokenResponse, error) {
	_, user, err := a.ValidateToken(ctx, refreshToken, GrantTypeRefresh)
	if err != nil {
		if errors.Is(err, bcode.ErrTokenExpired) {
			return nil, bcode.ErrRefreshTokenExpired
		}
		return nil, err
	}
	accessToken, newRefreshToken, err := a.issueTokens(user)
	if err != nil {
		return nil, err
	}
	return &apisv1.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// Logout ends every session of the user by raising their token generation.
func (a *authenticationServiceImpl) Logout(ctx context.Context, username string) error {
	user := &model.User{Name: username}
	if err := a.Store.Get(ctx, user); err != nil {
		return err
	}
	user.TokenGeneration++
	return a.Store.Put(ctx, user)
}

// ParseToken parses and verifies a token
func ParseToken(tokenString string) (*model.CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &model.CustomClaims{}, func(token *jwt.Token) (interface{}, error) { //nolint:revive,unused
		return []byte(signedKey), nil
	})
	if err != nil {
		var ve *jwt.ValidationError
		if jwtErr := errors.As(err, &ve); jwtErr {
			switch ve.Errors {
			case jwt.ValidationErrorExpired:
				return nil, bcode.ErrTokenExpired
			case jwt.ValidationErrorNotValidYet:
				return nil, bcode.ErrTokenNotValidYet
			case jwt.ValidationErrorMalformed:
				return nil, bcode.ErrTokenMalformed
			default:
				return nil, bcode.ErrTokenInvalid
			}
		}
		return nil, err
	}
	if claims, ok := token.Claims.(*model.CustomClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, bcode.ErrTokenInvalid
}

func (a *authenticationServiceImpl) GetDexConfig(ctx context.Context) (*apisv1.DexConfigResponse, error) {
	config, err := getDexConfig(ctx, a.KubeClient)
	if err != nil {
		return nil, err
	}
	return &apisv1.DexConfigResponse{
		Issuer:      config.Issuer,
		ClientID:    config.StaticClients[0].ID,
		RedirectURL: config.StaticClients[0].RedirectURIs[0],
	}, nil
}

func generateDexConfig(ctx context.Context, kubeClient client.Client, update *model.UpdateDexConfig) error {
	secret, err := initDexConfig(ctx, kubeClient, update.VelaAddress)
	if err != nil {
		return err
	}
	dexConfig := &model.DexConfig{}
	if err := yaml.Unmarshal(secret.Data[secretDexConfigKey], dexConfig); err != nil {
		return err
	}
	if update.VelaAddress != "" {
		dexConfig.Issuer = fmt.Sprintf("%s/dex", update.VelaAddress)
		dexConfig.StaticClients[0].RedirectURIs = []string{fmt.Sprintf("%s/callback", update.VelaAddress)}
	}
	if update.Connectors != nil {
		dexConfig.Connectors = update.Connectors
	}
	if len(update.StaticPasswords) > 0 {
		dexConfig.StaticPasswords = update.StaticPasswords
	}
	// This is the title that the dex login page.
	// It will be: Log in to KubeVela
	if dexConfig.Frontend.Issuer == "" {
		dexConfig.Frontend.Issuer = "KubeVela"
	}
	config, err := model.NewJSONStructByStruct(dexConfig)
	if err != nil {
		return err
	}
	c, err := yaml.Marshal(config)
	if err != nil {
		return err
	}
	if !reflect.DeepEqual(secret.Data[secretDexConfigKey], c) {
		secret.Data[secretDexConfigKey] = c
		if err := kubeClient.Update(ctx, secret); err != nil {
			return err
		}
		if err := restartDex(ctx, kubeClient); err != nil && !errors.Is(err, bcode.ErrDexNotFound) {
			return err
		}
	}
	return nil
}

// legacyDexClientSecret is the Dex client secret every install was given before each got its own.
const legacyDexClientSecret = "velaux-secret"

// newDexClientSecret is a random Dex client secret for one install.
func newDexClientSecret() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// Init gives an install still holding the Dex client secret every install once shared one of its
// own, and restarts Dex to read it. A failure is logged, not fatal: login works as before.
func (a *authenticationServiceImpl) Init(ctx context.Context) error {
	if err := a.replaceLegacyDexClientSecret(ctx); err != nil {
		klog.Warningf("could not replace the shared Dex client secret: %s", err.Error())
	}
	return nil
}

func (a *authenticationServiceImpl) replaceLegacyDexClientSecret(ctx context.Context) error {
	secret := &corev1.Secret{}
	if err := a.KubeClient.Get(ctx, types.NamespacedName{Name: dexConfigName, Namespace: velatypes.DefaultKubeVelaNS}, secret); err != nil {
		return client.IgnoreNotFound(err)
	}
	dexConfig := &model.DexConfig{}
	if err := yaml.Unmarshal(secret.Data[secretDexConfigKey], dexConfig); err != nil {
		return err
	}
	if len(dexConfig.StaticClients) == 0 || dexConfig.StaticClients[0].Secret != legacyDexClientSecret {
		return nil
	}
	clientSecret, err := newDexClientSecret()
	if err != nil {
		return err
	}
	dexConfig.StaticClients[0].Secret = clientSecret
	config, err := yaml.Marshal(dexConfig)
	if err != nil {
		return err
	}
	secret.Data[secretDexConfigKey] = config
	if err := a.KubeClient.Update(ctx, secret); err != nil {
		return err
	}
	klog.Info("replaced the shared Dex client secret with one of this install's own")
	return restartDex(ctx, a.KubeClient)
}

func initDexConfig(ctx context.Context, kubeClient client.Client, velaAddress string) (*corev1.Secret, error) {
	clientSecret, err := newDexClientSecret()
	if err != nil {
		return nil, err
	}
	dexConfig := model.DexConfig{
		Issuer: fmt.Sprintf("%s/dex", velaAddress),
		Web: model.DexWeb{
			HTTP: "0.0.0.0:5556",
		},
		Storage: model.DexStorage{
			Type: "kubernetes",
			Config: model.DexStorageConfig{
				InCluster: true,
			},
		},
		StaticClients: []model.DexStaticClient{
			{
				ID:           "velaux",
				Name:         "VelaUX",
				Secret:       clientSecret,
				RedirectURIs: []string{fmt.Sprintf("%s/callback", velaAddress)},
			},
		},
		EnablePasswordDB: true,
	}

	secret := &corev1.Secret{}
	if err := kubeClient.Get(ctx, types.NamespacedName{
		Name:      dexConfigName,
		Namespace: velatypes.DefaultKubeVelaNS,
	}, secret); err != nil || secret.Data == nil {
		if !kerrors.IsNotFound(err) {
			return nil, err
		}
		config, err := yaml.Marshal(dexConfig)
		if err != nil {
			return nil, err
		}
		secret = &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      dexConfigName,
				Namespace: velatypes.DefaultKubeVelaNS,
			},
			Type: corev1.SecretTypeOpaque,
			Data: map[string][]byte{
				secretDexConfigKey: config,
			},
		}
		if err := kubeClient.Create(ctx, secret); err != nil {
			return nil, err
		}
	}
	return secret, nil
}

func restartDex(ctx context.Context, kubeClient client.Client) error {
	dexApp := &v1beta1.Application{}
	if err := kubeClient.Get(ctx, types.NamespacedName{
		Name:      dexAddonName,
		Namespace: velatypes.DefaultKubeVelaNS,
	}, dexApp); err != nil {
		if kerrors.IsNotFound(err) {
			// skip restart dex if dex addon is not exist
			return nil
		}
		return err
	}
	for i, comp := range dexApp.Spec.Components {
		if comp.Name == keyDex {
			var v model.JSONStruct
			err := json.Unmarshal(comp.Properties.Raw, &v)
			if err != nil {
				return err
			}
			// restart the dex server
			if _, ok := v["values"]; ok {
				v["values"].(map[string]interface{})["env"] = map[string]string{
					"TIME_STAMP": time.Now().Format(time.RFC3339),
				}
			}
			dexApp.Spec.Components[i].Properties = v.RawExtension()
			if err := kubeClient.Update(ctx, dexApp); err != nil {
				return err
			}
			break
		}
	}
	oam.SetPublishVersion(dexApp, apiutils.GenerateVersion("addon"))
	return kubeClient.Update(ctx, dexApp)
}

func getDexConfig(ctx context.Context, kubeClient client.Client) (*model.DexConfig, error) {
	dexConfigSecret := &corev1.Secret{}
	if err := kubeClient.Get(ctx, types.NamespacedName{
		Name:      dexConfigName,
		Namespace: velatypes.DefaultKubeVelaNS,
	}, dexConfigSecret); err != nil {
		if kerrors.IsNotFound(err) {
			dexConfigSecret, err = initDexConfig(ctx, kubeClient, "http://velaux.com")
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	if dexConfigSecret.Data == nil {
		return nil, bcode.ErrInvalidDexConfig
	}

	config := &model.DexConfig{}
	if err := yaml.Unmarshal(dexConfigSecret.Data[secretDexConfigKey], config); err != nil {
		klog.Errorf("failed to unmarshal dex config: %s", err.Error())
		return nil, bcode.ErrInvalidDexConfig
	}
	if len(config.StaticClients) < 1 || len(config.StaticClients[0].RedirectURIs) < 1 {
		return nil, bcode.ErrInvalidDexConfig
	}
	return config, nil
}

func (a *authenticationServiceImpl) GetLoginType(ctx context.Context) (*apisv1.GetLoginTypeResponse, error) {
	sysInfo, err := a.SysService.Get(ctx)
	if err != nil {
		return nil, err
	}
	loginType := sysInfo.LoginType
	if loginType == "" {
		loginType = model.LoginTypeLocal
	}
	return &apisv1.GetLoginTypeResponse{
		LoginType: loginType,
	}, nil
}

func getUserName(sub string) string {
	username := strings.ToLower(sub)
	if len(sub) > datastore.PrimaryKeyMaxLength {
		return sub[:datastore.PrimaryKeyMaxLength]
	}
	return username
}

func (d *dexHandlerImpl) login(ctx context.Context) (*apisv1.UserBase, error) {
	var claims struct {
		Email string `json:"email"`
		// Name End-User's full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User's locale and preferences.
		Name string `json:"name"`
		// Subject - Identifier for the End-User at the Issuer.
		Sub string `json:"sub"`
	}
	if err := d.idToken.Claims(&claims); err != nil {
		return nil, err
	}
	var users []datastore.Entity
	var err error
	if claims.Email != "" {
		user := &model.User{Email: claims.Email}
		users, err = d.Store.List(ctx, user, &datastore.ListOptions{})
		if err != nil {
			return nil, err
		}
	}
	if len(users) == 0 && claims.Sub != "" {
		// Support query the user by the subject
		user := &model.User{DexSub: claims.Sub}
		users, err = d.Store.List(ctx, user, &datastore.ListOptions{})
		if err != nil {
			return nil, err
		}
	}
	var userBase *apisv1.UserBase
	if len(users) > 0 {
		u := users[0].(*model.User)
		u.LastLoginTime = time.Now()
		u.DexSub = claims.Sub
		if err := d.Store.Put(ctx, u); err != nil {
			return nil, err
		}
		userBase = convertUserBase(u)
	} else {
		systemInfo, err := d.systemInfoService.GetSystemInfo(ctx)
		if err != nil {
			klog.Errorf("failed to get the system info %s", err.Error())
		}
		user := &model.User{
			Email:         claims.Email,
			Name:          getUserName(claims.Sub),
			DexSub:        claims.Sub,
			Alias:         claims.Name,
			LastLoginTime: time.Now(),
		}
		if systemInfo != nil {
			user.UserRoles = systemInfo.DexUserDefaultPlatformRoles
		}
		if err := d.Store.Add(ctx, user); err != nil {
			klog.Errorf("failed to save the user from the dex: %s", err.Error())
			return nil, err
		}
		if systemInfo != nil {
			for _, project := range systemInfo.DexUserDefaultProjects {
				_, err := d.projectService.AddProjectUser(ctx, project.Name, apisv1.AddProjectUserRequest{
					UserName:  getUserName(claims.Sub),
					UserRoles: project.Roles,
				})
				if err != nil {
					klog.Errorf("failed to add a user to project %s", err.Error())
				}
			}
		}
		userBase = convertUserBase(user)
	}

	return userBase, nil
}

func (l *localHandlerImpl) login(ctx context.Context) (*apisv1.UserBase, error) {
	user, err := l.userService.GetUser(ctx, l.username)
	if err != nil {
		if errors.Is(err, datastore.ErrRecordNotExist) {
			return nil, bcode.ErrUsernameNotExist
		}
		return nil, err
	}
	if err := compareHashWithPassword(user.Password, l.password); err != nil {
		return nil, err
	}
	if user.Disabled {
		return nil, bcode.ErrUserAlreadyDisabled
	}
	if err := l.userService.UpdateUserLoginTime(ctx, user); err != nil {
		return nil, err
	}
	return convertUserBase(user), nil
}

// FakeAdminName is the fake admin name for testing
var FakeAdminName = "fake-admin"

// InitTestAdmin is used to init fake admin user, use FakeAdminName as username
var InitTestAdmin = func(us UserService) (bool, error) {
	if resp, err := us.AdminConfigured(context.Background()); err != nil {
		return false, err
	} else if resp.Configured {
		return true, nil
	}
	initResp, err := us.InitAdmin(context.Background(), apisv1.InitAdminRequest{
		Password: "ComplexPassword1",
		Email:    "fake@kubevela.io",
		Name:     FakeAdminName,
	})
	return initResp.Success, err
}
