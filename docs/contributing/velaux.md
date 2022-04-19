# Contribute VelaUX

Before start, please make sure you have already started the vela api server environment.

If your api server address is 'http://127.0.0.1:8000', configure the api server address:

```shell
echo "BASE_DOMAIN='http://127.0.0.1:8000'" > .env
```

Make sure you have installed [yarn](https://classic.yarnpkg.com/en/docs/install).

Run this project:

```shell
yarn install
yarn start
```

* Check the code style

```shell
yarn lint
```

* Test the code

```shell
yarn test
```
