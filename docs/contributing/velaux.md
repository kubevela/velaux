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

2. Install VelaUX

```bash
vela addon enable velaux
vela port-forward addon-velaux -n vela-system 9082:80
```

## Start the UI project

```shell
echo "BASE_DOMAIN='http://127.0.0.1:9082'" > .env
```

Make sure you have installed [yarn](https://classic.yarnpkg.com/en/docs/install).

```shell
yarn install
yarn start
```

> The default account/password is `admin/VelaUX12345`

* Check the code style

```shell
yarn lint
```

* Test the code

```shell
yarn test
```

## Read the API documents

Refer to [Kubevela API 1.4](https://kubevela.stoplight.io/docs/kubevela/uz7fzdxthv175-kube-vela-api-1-4)
