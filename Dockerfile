# Build the manager binary
FROM --platform=${BUILDPLATFORM:-linux/amd64} golang:1.16-alpine as builder

WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go env -w GO111MODULE=on
RUN go env -w GOPROXY=https://goproxy.io,direct
RUN go mod download

# Copy the go source
COPY cmd/velacp/main.go main.go
COPY pkg/ pkg/
COPY version/ version/
# COPY api/ api/
# COPY controllers/ controllers/

# Build
ARG TARGETARCH
ARG VERSION
ARG GITVERSION
RUN GO111MODULE=on CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} \
    go build -a -ldflags "-s -w -X github.com/oam-dev/velacp/version.VelaVersion=${VERSION:-undefined} -X github.com/oam-dev/velacp/version.GitRevision=${GITVERSION:-undefined}" \
    -o manager-${TARGETARCH} main.go

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
# Overwrite `BASE_IMAGE` by passing `--build-arg=BASE_IMAGE=gcr.io/distroless/static:nonroot`

ARG BASE_IMAGE
FROM ${BASE_IMAGE:-alpine:latest}
# This is required by daemon connnecting with cri
RUN apk add --no-cache ca-certificates bash

WORKDIR /

ARG TARGETARCH
COPY --from=builder /workspace/manager-${TARGETARCH} /usr/local/bin/manager

# USER nonroot:nonroot
# ENTRYPOINT ["/manager"]

ENTRYPOINT ["entrypoint.sh"]

CMD ["manager"]
