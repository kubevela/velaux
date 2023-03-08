![alt](docs/images/KubeVela-03.png)

[![Go Report Card](https://goreportcard.com/badge/github.com/kubevela/velaux)](https://goreportcard.com/report/github.com/kubevela/velaux)
![Docker Pulls](https://img.shields.io/docker/pulls/oamdev/velaux)

## Overview

The [KubeVela](https://github.com/oam-dev/kubevela) User Experience (UX) Platform. Designed as an extensible, application-oriented delivery control panel.

## Quick Start

### Users

Please refer to: [https://kubevela.net/docs/install](https://kubevela.net/docs/install)

### Developers

#### Build the frontend

Make sure you have installed [yarn](https://classic.yarnpkg.com/en/docs/install).

```shell
yarn install
yarn build
```

#### Start the server

1. Install the Go 1.19
2. Prepare a KubeVela core environment.

  ```shell
  ## Linux or Mac
  curl -fsSl https://static.kubevela.net/script/install-velad.sh | bash
  ## Windows
  powershell -Command "iwr -useb https://static.kubevela.net/script/install-velad.ps1 | iex"

  velad install
  ```

3. Init the dependencies.

  ```shell
  vela addon enable ./addon
  ```

4. Start the server on local

  ```shell
  go mod tidy
  make run-server
  ```

## Community

- Slack:  [CNCF Slack](https://slack.cncf.io/) #kubevela channel (*English*)
- [DingTalk Group](https://page.dingtalk.com/wow/dingtalk/act/en-home): `23310022` (*Chinese*)
- Wechat Group (*Chinese*) : Broker wechat to add you into the user group.

  <img src="https://static.kubevela.net/images/barnett-wechat.jpg" width="200" />

## Contributing

Check out [CONTRIBUTING](./CONTRIBUTING.md) to see how to develop with KubeVela.

## Report Vulnerability

Security is a first priority thing for us at KubeVela. If you come across a related issue, please send email to security@mail.kubevela.io .

## Code of Conduct

KubeVela adopts [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/master/code-of-conduct.md).
