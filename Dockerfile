# 1. ベースイメージの指定
FROM node:20

# 2. 作業ディレクトリの作成
WORKDIR /app

# 3. まず package.json 類をコピー（ルートにある場合）
COPY package*.json ./

# 4. 依存関係のインストール
# キャッシュをクリアして実行
RUN npm ci || npm install

# 5. その他のファイルをコピー
COPY . .

# 6. 起動（server.jsがapp/直下にある場合）
CMD ["node", "app/server.js"]