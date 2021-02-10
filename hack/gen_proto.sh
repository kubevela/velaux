#!/usr/bin/env bash

PROTOCMD="protoc \
		-I . \
		-I ${GOPATH}/src/github.com/envoyproxy/protoc-gen-validate \
		-I ${GOPATH}/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis \
		--go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=require_unimplemented_servers=false:. --go-grpc_opt=paths=source_relative \
		--validate_out="lang=go:." --validate_opt=paths=source_relative \
		--grpc-gateway_out . \
			--grpc-gateway_opt logtostderr=true \
			--grpc-gateway_opt paths=source_relative \
			--grpc-gateway_opt generate_unbound_methods=true \
		"

for entry in "pkg/proto"/*
do
  eval $PROTOCMD "${entry}/service.proto"
done

for entry in "pkg/datastore/model"/*
do
  if [ "${entry##*.}" = "proto" ]; then
    eval $PROTOCMD "${entry}"
  fi
done
