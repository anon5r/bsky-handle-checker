FROM node:23-alpine AS builder
ENV YARN_VERSION=3.6.3

# 必要なツールをインストール
RUN apk update \
    && apk add --no-cache curl \
    && corepack install -g yarn@${YARN_VERSION} \
    && corepack enable yarn \
    && yarn set version berry


# 作業ディレクトリ
WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./
COPY src/ ./src/
RUN yarn && yarn build

FROM node:23-alpine
ENV YARN_VERSION=3.6.3

WORKDIR /app

RUN apk update  \
    && apk add --no-cache curl \
    && corepack install -g yarn@${YARN_VERSION} \
    && corepack enable yarn \
    && yarn set version berry

COPY --from=builder /app/ .

# アプリケーションを起動
CMD ["yarn", "start"]
