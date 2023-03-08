# Contribute VelaUX

## Prepare the local environment

> Docker v20.10.5+ (runc >= v1.0.0-rc93) or Linux system

1. Install VelaCore

* Download the binary.

    * MacOS/Linux

    ```bash
    curl -fsSl https://static.kubevela.net/script/install-velad.sh | bash
    ```

    * Windows

    ```bash
    powershell -Command "iwr -useb https://static.kubevela.net/script/install-velad.ps1 | iex"
    ```

* Install

```bash
velad install
```

2. Install VelaUX environment

```bash
vela addon enable ./addon
```

## Start the server on local

Make sure you have installed [yarn](https://classic.yarnpkg.com/en/docs/install).

```shell
yarn install
yarn build
```

* Start the server

```shell
make run-server
```

* Check the code style

```shell
# Frontend
yarn lint
# Server
make reviewable
```

* Test the code

Frontend:

```shell
yarn test
```

Server:

```shell
make unit-test-server
make e2e-server-test
```

* Generate the OpenAPI schema

```shell
make build-swagger
```
