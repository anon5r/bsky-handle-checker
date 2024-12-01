FROM node:23-alpine

# 必要なツールをインストール
RUN apk add --no-cache curl

# 作業ディレクトリを作成
WORKDIR /app

# 必要なファイルをコピー
#COPY package.json yarn.lock tsconfig.json ./
COPY package.json tsconfig.json ./

# Corepackを有効化し、Yarnの指定バージョンを有効化
#RUN corepack enable
#RUN corepack prepare yarn@4.1.1 --activate

# 必要なパッケージをインストール
#RUN yarn install --frozen-lockfile
RUN npm i

# ソースをコピー
COPY src/ ./src/

# ビルド
#RUN yarn build
RUN npm run build

# アプリケーションを起動
#CMD ["yarn", "start"]
CMD ["npm", "run", "start"]
