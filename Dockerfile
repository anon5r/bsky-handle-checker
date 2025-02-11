FROM node:23-alpine AS builder

# 必要なツールをインストール
RUN apk update \
    && apk add --no-cache curl \
    && corepack enable \
    && corepack prepare pnpm@latest --activate \
    && pnpm fetch


# 作業ディレクトリ
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install --offline
COPY src/ ./src/
RUN pnpm build

FROM node:23-alpine AS runner
# 作業ディレクトリ
WORKDIR /app

#COPY src/ ./src/
COPY --from=builder /app/dist /app/dist
COPY ./package.json ./pnpm-lock.yaml /app/


# アプリケーションを起動
CMD ["yarn", "bot"]
