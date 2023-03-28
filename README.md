![alt](docs/images/KubeVela-03.png)

[![Go Report Card](https://goreportcard.com/badge/github.com/kubevela/velaux)](https://goreportcard.com/report/github.com/kubevela/velaux)
![Docker Pulls](https://img.shields.io/docker/pulls/oamdev/velaux)

## Overview

[VelaUX](https://github.com/kubevela/velaux) is a web portal for KubeVela end users, and also functions as an opinionated application delivery platform. Additionally, it operates as a highly adaptable plugin framework, empowering developers to create bespoke plugins and smoothly integrate them into the KubeVela platform. This approach delivers unparalleled flexibility and customization options for scaling up the platform's capabilities.

### Highlights

*Customizable User Interface*: With VelaUX, enterprises can tailor the user interface to their specific needs for managing applications and infrastructure. This feature leads to a more intuitive and efficient user experience, resulting in increased productivity and better resource utilization.

*Easy Integration*: VelaUX is designed for seamless integration with the KubeVela platform, simplifying the deployment and management of cloud-native atomic capabilities within the platform. This makes it easier for enterprises to build platforms that meet their needs for continuous application delivery, observability, security, and other requirements based on these cloud-native atomic capabilities.

*Out-of-Box Platform*: VelaUX provides a comprehensive set of features that empower enterprises to deploy and monitor their applications effectively. These features include multi-cluster and multi-environment support, pipeline management, observability, and more. Additionally, VelaUX streamlines the complexities of Kubernetes, making it simpler for users to manage their deployments.

## Quick Start

### Users

Please refer to this guide to install: [https://kubevela.net/docs/install](https://kubevela.net/docs/install)

### Developers

#### Build the frontend

Make sure you have installed [yarn 2.0](https://yarnpkg.com/getting-started/install), This is required.

Install frontend dependencies and build the frontend.

```shell
yarn install
yarn build
```

#### Start the server

1. Install the Go 1.19+.
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
  vela addon enable ./addon replicas=0
  ```

4. Start the server on local

  ```shell
  # Install all dependencies
  go mod tidy

  # Setting the kube config
  export KUBECONFIG=$(velad kubeconfig --host)

  # Start the server
  make run-server
  ```

Then, you can open the http://127.0.0.1:8000. More info refer to [contributing](./docs/contributing/velaux.md)

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
