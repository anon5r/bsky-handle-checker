FROM node:23-alpine AS builder

# 必要なツールをインストール
RUN apk update && apk add --no-cache curl

# 作業ディレクトリ
WORKDIR /app

COPY package.json tsconfig.json ./
COPY src/ ./src/

FROM builder

COPY . .

WORKDIR /app

RUN npm i && npm run build

# アプリケーションを起動
CMD ["npm", "run", "start"]
