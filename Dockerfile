FROM node:23-alpine AS builder

# 必要なツールをインストール
RUN apk update \
    && apk add --no-cache curl jq \
    && corepack enable \
    && corepack prepare pnpm@latest --activate \
    && pnpm fetch


# 作業ディレクトリ
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install
COPY src/ ./src/
RUN pnpm build


# package.json の scripts キーを jq で取得し、動的にentrypoint.sh を生成
RUN export ENTRYPOINT_PATH=/usr/local/bin/entrypoint.sh \
  && echo '#!/bin/sh' > $ENTRYPOINT_PATH \
  && echo 'set -e' >> $ENTRYPOINT_PATH \
  && echo 'case "$1" in' >> $ENTRYPOINT_PATH \
  && jq -r '.scripts | keys[]' package.json \
   | sed -E 's/(.*)/  \1)\n    exec pnpm run \1\n    ;;/' >> $ENTRYPOINT_PATH \
  && echo '  *)' >> $ENTRYPOINT_PATH \
  && echo '    exec "$@"' >> $ENTRYPOINT_PATH \
  && echo '    ;;' >> $ENTRYPOINT_PATH \
  && echo 'esac' >> $ENTRYPOINT_PATH \
  && chmod +x $ENTRYPOINT_PATH


FROM node:23-alpine AS runner
# 作業ディレクトリ
WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY ./package.json ./pnpm-lock.yaml /app/
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && corepack enable \
    && corepack prepare pnpm@latest --activate \
    && pnpm install --prod \
    && pnpm cache delete


ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# アプリケーションを起動
CMD ["start"]
