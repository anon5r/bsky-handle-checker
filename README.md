Bluesky Handle Checker
====

[日本語版はこちら](./README.ja.md)

# Overview

This tool is an application that checks for the existence of handles for specific domains on Bluesky.
It can be managed via Discord, and results are notified to Discord channels.
SQLite is used for data persistence.


**[Click here for how to use the Bot](./docs/how-to-use-discord-bot.md)**

# Requirements

- Node.js (v23 or higher)
- pnpm
- Docker (if using Docker)
- `.env` file configuration
- Creation of `./data/` directory

# Environment Setup

## 1. Setting Environment Variables

1. Copy `.env.example` to `.env`
2. Set the necessary values in the `.env` file

## 2. Creating Data Directory

``` shell
mkdir ./data
```

## 3. Discord Bot Setup

1. Create a new application on the [Discord Developer Portal](https://discord.com/developers/applications)
2. Set the following items in the `.env` file:
``` env
DISCORD_TOKEN=Your bot token
DISCORD_CLIENT_ID=Application client ID
```
3. Bot scopes:
    - `bot`
    - `applications.commands`
4. Required bot permissions: 18432
    - **Send Messages**
    - **Embed Links**
When inviting the bot to a server, please grant the above permissions.
Without these permissions, the bot may not function properly.



# Installation and Execution Methods

## Running in Node.js Environment

1. Install packages
``` shell
pnpm install
```
2. Build
``` shell
pnpm build
```
3. Initialize DB
``` shell
pnpm migrate
```
4. Execution methods

- Start Discord bot:
``` shell
pnpm bot
```
- Run crawler:
``` shell
pnpm crawl
```
- Notify crawl results:
``` shell
pnpm notify
```
- Run crawler and result notification simultaneously:
``` shell
pnpm start
```


## Running in Docker Environment

### Building and Running in Local Environment
1. Build image
``` shell
docker compose build
```
2. Initialize DB
``` shell
docker compose run --rm -it app migrate
```
3. Start Discord bot
``` shell
docker compose up -d bot
```
4. Run crawler
``` shell
docker compose up crawler
```
5. Notify crawl results
``` shell
docker compose up notifier
```

### Running as Individual Containers
0. Create builder
``` shell
docker buildx create --name mybuilder --use
```
1. Build image
``` shell
docker buildx build --platform linux/amd64,linux/arm64 -t <your-docker-registory>:latest -f Dockerfile --push .
```
2. Initialize DB
``` shell
docker run --env-file .env -v ./data:/app/data --name bsky-checker ghcr.io/anon5r/bsky-handle-checker:latest migrate
```
3. Start Discord bot
``` shell
docker run -d --env-file .env -v ./data:/app/data --name bsky-check-bot ghcr.io/anon5r/bsky-handle-checker:latest bot
```
4. Run crawler
``` shell
docker run --env-file .env -v ./data:/app/data --name bsky-checker ghcr.io/anon5r/bsky-handle-checker:latest crawl
```
5. Notify crawl results
``` shell
docker run --env-file .env -v ./data:/app/data --name bsky-checker ghcr.io/anon5r/bsky-handle-checker:latest notify
```


# How It Works

Checks whether a handle DID can be referenced from a domain name.

> [!NOTE]
> It does not verify whether the domain is actually set as a handle for an account.

### [Sequence Diagram](./docs/sequence.md)

# Technology Stack

- Node.js 23.x
- TypeScript 5.7.x
- Discord.js 14.x
- SQLite 3.42
- Other major packages:
    - dotenv
    - axios
    - umzug
    - better-sqlite3

This application can be run directly in a Node.js environment or in a Docker environment, depending on your environment and needs.
Follow the setup to execution steps to prepare the necessary environment.
