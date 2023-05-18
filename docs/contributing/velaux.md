# Contribute VelaUX

## Prepare the local environment

### Install VelaCore

1. Check requirements

    * VelaD support installing KubeVela on machines based on these OS: Linux, macOS, Windows.
    * If you are using Linux or macOS, make sure your machine have `curl` installed.
    * If you are using macOS or Windows, make sure you've already installed [Docker](https://www.docker.com/products/docker-desktop).

2. Download the binary.

    * MacOS/Linux

    ```bash
    curl -fsSl https://static.kubevela.net/script/install-velad.sh | bash
    ```

    * Windows

    ```bash
    powershell -Command "iwr -useb https://static.kubevela.net/script/install-velad.ps1 | iex"
    ```

3. Install

    ```bash
    velad install
    ```

4. Install VelaUX environment

    ```bash
    vela addon enable ./addon
    ```

## Start the server on local

Make sure you have installed [yarn 2.0](https://yarnpkg.com/getting-started/install), This is required.

```shell
yarn install

yarn build-packages

## Build the frontend and watch the code changes
yarn dev
```

### Start the server

```shell
## Setting the KUBECONFIG environment
export KUBECONFIG=$(velad kubeconfig --host)

make run-server
```

Waiting the server started, open http://127.0.0.1:8000 via the browser.

Now, the local environment is built successfully, you could write the server or frontend code.

Notes:

* If you change the frontend code, it will take effect after the website refresh.
* If you change the server code, it will take effect after restarted the server.

### Check the code style

```shell
# Frontend
yarn lint
# Server
make reviewable
```

### Test the code

For testing server kubebuilder and its dependency tools are required. To install them you can use:

```shell
make setup-test-server
```

Frontend:

```shell
yarn test
```

Server:

```shell
make unit-test-server
make e2e-server-test
```

### Generate the OpenAPI schema

```shell
make build-swagger
```

### Config yarn2 in vscode

Add following config in `settings.json`
```json
{
  "search.exclude": {
    "**/.yarn": true,
    "**/.pnp.*": true
  },
  "typescript.tsdk": ".yarn/sdks/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Develop the plugin

Reference: [How to build a plugin](./how-to-build-plugin)

## References

* UI framework: [@alifd/next](https://fusion.design/)
* Icons: [react-icons](https://react-icons.github.io/react-icons)