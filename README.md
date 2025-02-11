Bluesky handle checker
=======

Bluesky上に特定ドメインのハンドルが存在するか確認します。

`data/domains.json` に列挙されたFQDNに対してDIDが参照できるか確認します。

カスタムハンドルとして一度確認が取れたドメインは `data/checkedDomains.json` に記録されます。これはただの検証済みリストとしてのみ使用し、記録した日時は保存しません

※ドメイン名からハンドル用DIDが参照できるかのみ確認します。

※ドメインが実際にアカウントのハンドルとして設定されているかどうかは検証されません

# Setup

1. `data/` ディレクトリを作成します。
2. Dockerから実行時は `/app/data` にマウントします。
3. `data/domains.json` を作成します。
    ```json
   [
      "nhk.or.jp",
      "nintendo.com",
      "facebook.com",
      "x.com",
      "twitter.com"
   ]
   ```
4. `.env.example`ファイルをコピーし、`.env` を作成します。 
5. `.env` 内、あるいは環境変数 `DISCORD_WEBHOOK_URL` にDiscordチャンネルのWebHook URLを指定します。 

# Run on Docker

## How to build

```shell
docker buildx build --platform linux/amd64,linux/arm64 -t <your-docker-registory>:latest --push .
```

```shell
docker compose build
```

## How to run

```shell
docker compose up
```
or
```shell
docker run -e DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXXXXXX/ -v ./data:/app/data --name bsky-handle-check <your-container-registry>/<image-name>
```

# Node

## How to run

```shell
$ pnpm i
$ pnpm run build
```

### Crawling handles

```shell
$ pnpm run crawl
```

### Run as discord slash command server

```shell
$ pnpm run bot
```
