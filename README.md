# Bluesky Handle Checker

## 概要

このツールは、Bluesky上での特定ドメインのハンドル存在確認を行うアプリケーションです。Discord経由で管理が可能で、結果はDiscordチャンネルに通知されます。データの永続化にはSQLiteを使用しています。

## 必要要件

- Node.js (v23以上)
- pnpm
- Docker（Dockerを使用する場合）
- `.env`ファイルの設定
- `./data/`ディレクトリの作成

## 環境設定

### 1. 環境変数の設定

1. `.env.example`を`.env`にコピー
2. `.env`ファイル内の必要な値を設定

### 2. データディレクトリの作成

``` shell
mkdir ./data
```

## インストールと実行方法

### Node.js環境での実行

1. パッケージのインストール

``` shell
pnpm install
```

1. ビルド
``` shell
pnpm build
```
2. 実行方法

- Discordボットの起動:
``` shell
pnpm bot
```
- クローラーの実行:
``` shell
pnpm crawl
```
- クロール結果の通知
``` shell
pnpm notify
```
- クローラーと結果通知の同時実行
``` shell
pnpm start
```


### Docker環境での実行

#### ローカル環境でのビルドと実行

1. イメージのビルド
``` shell
docker compose build
```
2. アプリケーションの起動
``` shell
docker compose up
```

#### 個別のコンテナとして実行

**ボットの起動**
``` shell
docker run -d --env-file .env -v ./data:/app/data --name bsky-check-bot ghcr.io/anon5r/bsky-handle-checker:latest bot
```

**クローラーの実行**
``` shell
docker run --env-file .env -v ./data:/app/data --name bsky-checker ghcr.io/anon5r/bsky-handle-checker:latest crawl
```
#### マルチアーキテクチャ向けビルド

1. ビルダーの作成
``` shell
docker buildx create --name mybuilder --use
```
2. マルチアーキテクチャ用ビルド
``` shell
docker buildx build --platform linux/amd64,linux/arm64 -t <your-docker-registory>:latest -f Dockerfile --push .
```

## 動作の仕組み

ドメイン名からハンドル用DIDが参照可能かどうかを確認します

> [!NOTE]
> ドメインが実際にアカウントのハンドルとして設定されているかどうかの検証は行いません

## 技術スタック

- Node.js 23.x
- TypeScript 5.7.x
- Discord.js 14.x
- SQLite 3.42
- その他の主要パッケージ:
    - dotenv
    - axios
    - umzug
    - better-sqlite3

このアプリケーションは、環境や用途に応じてNode.js環境での直接実行とDocker環境での実行のいずれかを選択できます。セットアップから実行までの手順に従って、必要な環境を整えてください。

## ライセンス

MIT License
