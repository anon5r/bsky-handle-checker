Bluesky handle checker
=======


特定のハンドルが存在するか確認します


# Run on Docker

## How to build

```shell
$ docker buildx build --platform linux/amd64,linux/arm64 -t cr.anon.network/bluesky-handle-checker:latest --push .
```

```shell
$ docker compose build
```

## How to run

```shell
$ docker compose up
```

# Node

## How to test

```shell
$ npm i
$ npm run start
```
