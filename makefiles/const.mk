SHELL := /bin/bash

GOLANGCILINT_VERSION ?= 1.49.0

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

GLOBAL_GOLANGCILINT := $(shell which golangci-lint)
GOBIN_GOLANGCILINT:= $(shell which $(GOBIN)/golangci-lint)

# VelaUX version
VELAUX_VERSION ?= main
# Repo info
GIT_COMMIT          ?= git-$(shell git rev-parse --short HEAD)
GIT_COMMIT_LONG     ?= $(shell git rev-parse HEAD)
VELAUX_VERSION_KEY    := github.com/kubevela/velaux/version.VelaVersion
VELAUX_GITVERSION_KEY := github.com/kubevela/velaux/version.GitRevision
LDFLAGS             ?= "-s -w -X $(VELAUX_VERSION_KEY)=$(VELAUX_VERSION) -X $(VELAUX_GITVERSION_KEY)=$(GIT_COMMIT)"

TIME_LONG	= `date +%Y-%m-%d' '%H:%M:%S`
TIME_SHORT	= `date +%H:%M:%S`
TIME		= $(TIME_SHORT)

BLUE         := $(shell printf "\033[34m")
YELLOW       := $(shell printf "\033[33m")
RED          := $(shell printf "\033[31m")
GREEN        := $(shell printf "\033[32m")
CNone        := $(shell printf "\033[0m")

INFO	= echo ${TIME} ${BLUE}[INFO]${CNone}
WARN	= echo ${TIME} ${YELLOW}[WARN]${CNone}
ERR		= echo ${TIME} ${RED}[FAIL]${CNone}
OK		= echo ${TIME} ${GREEN}[ OK ]${CNone}
FAIL	= (echo ${TIME} ${RED}[FAIL]${CNone} && false)
