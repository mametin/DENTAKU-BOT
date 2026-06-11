# DENTAKU-BOT (電卓BOT)

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)
![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?logo=discord&logoColor=fff)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff)

Discordサーバー向けの多機能スケジュール管理BOTです。日程調整、ダイスロール、ロール管理など、様々な機能を提供します。

## 🌐 Website

[https://dentaku-bot.vercel.app](https://dentaku-bot.vercel.app)

## ✨ 主な機能

### 📅 スケジュール管理
- **日程追加**: Google Spreadsheetに日程情報を登録
- **日程表示**: Google Spreadsheet・Googleカレンダーへのリンク提供
- **日程削除**: 登録された日程をIDで削除
- **日程修正**: 既存の日程情報を更新
- **日程検索**: 日付・タイトル・KP名・PL名で検索可能

### 🎲 ダイスロール機能
複数のテーブルトークRPGシステムに対応：
- **クトゥルフ神話TRPG (CoC)**
  - CoC 6th Edition
  - CoC 7th Edition
- **シノビガミ** (ShinobiGami)
- **ソードワールド2.5** (Sword World 2.5)
- **カスタムダイス**: 汎用ダイスロール・カスタム表

### 🎯 その他の機能
- **おみくじ**: ランダムに吉凶を占う
- **ロール選択パネル**: サーバーメンバーがロールを自由に選択・切り替え可能
- **お知らせ機能**: BOT管理者がサーバー全体にお知らせを配信

## 🏗️ プロジェクト構成

```
DENTAKU-BOT/
├── app/
│   ├── bot/
│   │   ├── code.js           # Discord BOT メインロジック
│   │   └── register.js       # コマンド登録
│   ├── frontend/             # React フロントエンド
│   │   └── src/              # ソースコード
│   └── server.js             # Express サーバー & API
├── Dockerfile                # Docker設定
├── package.json              # ルートディレクトリの依存関係
└── README.md                 # このファイル
```

## 🚀 セットアップ方法

### 前提条件
- Node.js 20.x 以上
- Discordアカウント & サーバー管理権限
- Google Cloud プロジェクト (Spreadsheet API)
- Google Apps Script (GAS)

### インストール

1. **リポジトリのクローン**
```bash
git clone https://github.com/mametin/DENTAKU-BOT.git
cd DENTAKU-BOT
```

2. **依存関係のインストール**
```bash
npm install
cd app && npm install
cd frontend && npm install && cd ../..
```

3. **環境変数の設定**

`.env` ファイルを作成し、以下の環境変数を設定します：

```env
# Discord BOT
DISCORD_BOT_TOKEN=your_discord_bot_token

# Google 認証情報
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
```

### 開発サーバー起動

```bash
# バックエンド（Express + Discord BOT）
npm run dev

# フロントエンド（別ターミナルで実行）
cd app/frontend
npm run dev
```

### 本番環境での起動

```bash
npm start
```

## 📦  主な依存関係

| パッケージ | 用途 |
|----------|------|
| `discord.js` | Discord BOT フレームワーク |
| `bcdice` | ダイスロール処理 |
| `express` | Webサーバー |
| `google-spreadsheet` | Google Spreadsheet API クライアント |
| `google-auth-library` | Google 認証 |
| `axios` | HTTP クライアント |
| `react` | フロントエンド (UI フレームワーク) |
| `vite` | フロントエンド ビルドツール |

## 🔧 コマンド一覧

| コマンド | 説明 |
|--------|------|
| `/hello` | ユーザーに挨拶 (日本語/英語) |
| `/add` | 新しい日程を追加 |
| `/show` | Spreadsheet・Googleカレンダーのリンク表示 |
| `/delete` | IDを指定して日程を削除 |
| `/correct` | IDを指定して日程を修正 |
| `/search` | 日付・タイトル・KP名・PL名で日程を検索 |
| `/omikuji` | おみくじを引く |
| `/notice` | お知らせを配信 (管理者限定) |
| `/setup_roles` | ロール選択パネルを生成 (管理者限定) |

### ダイスロールコマンド

メッセージで以下のコマンドを送信すると、ダイスが自動的にロールされます：

```
coc <ロール式>      # CoC 6th Edition
coc7 <ロール式>     # CoC 7th Edition
sinobi <ロール式>   # シノビガミ
SW <ロール式>       # ソードワールド2.5
<ロール式>          # 汎用ダイスロール (DiceBot)
table <表定義>      # カスタム表のロール
```

**例:**
```
coc 1d100<=60
coc7 2d6+2
sinobi 4d10
SW 2d6
1d20+5
choice[赤,青,緑]
```

## 🐳 Docker での実行

```bash
docker build -t dentaku-bot .
docker run --env-file .env dentaku-bot
```

## 🤝 連携システム

### Google Spreadsheet
- スケジュール情報の保存・管理
- マルチユーザー対応

### Google Apps Script (GAS)
- Google Spreadsheet へのデータ書き込み
- 複雑なビジネスロジック処理

### Google Calendar
- スケジュールの一元管理・表示

### React フロントエンド
- Web UI での データ閲覧・管理

## 📝 License

このプロジェクトはMITライセンスの下で公開されています。

## 🐛 Issues & Contributions

不具合報告や機能提案は、[GitHub Issues](https://github.com/mametin/DENTAKU-BOT/issues) でお願いします。

プルリクエストも歓迎です！

## 📧 Contact

質問やサポートが必要な場合は、Discordで管理者にご連絡ください。

---

**Last Updated:** 2026-06-11
