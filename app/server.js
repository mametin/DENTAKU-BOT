const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const app = express();

// POSTデータ受け取りのための設定
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJSを使う設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ====================================================
// 設定・定数
// ====================================================
// スプレッドシートID
const SPREADSHEET_ID = '1wx0ezY3Vdad7z09KESFhN_sCMeSKaaGWlkH2To1cOiw';

// ヘッダー行のインデックス (ユーザー名)
const HEADER_ROW_INDEX = 4;

// ====================================================
// データ取得関数
// ====================================================
async function getSheetData() {
  try {
    // 環境変数のチェック
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEYが設定されていません。");
      return [];
    }

    // 認証設定
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // スプレッドシート読み込み
    const s = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await s.loadInfo();

    // 1枚目のシートを取得
    const sheet = s.sheetsByIndex[0];

    // ヘッダー行を読み込み
    await sheet.loadHeaderRow(HEADER_ROW_INDEX);

    // データ行を取得
    const rows = await sheet.getRows();

    // 全ヘッダーからユーザー列を抽出
    const allHeaders = sheet.headerValues;
    const userColumns = allHeaders.filter(header => {
      return header !== '日付' && header !== 'Date' && header !== '' && header !== undefined;
    });

    // ====================================================
    // データ整形関数
    // ====================================================
    // データを整形＆集計
    const data = rows.map(row => {
      // 日付列の取得 (日本語'日付' または 英語'Date' に対応)
      const dateVal = row.get('日付') || row.get('Date') || '日付不明';

      let availableCount = 0; // 空き数のカウント用
      const availabilityDetails = {}; // ユーザーごとの詳細 { "PL1": "〇", ... }

      // 各ユーザーの列をチェック
      userColumns.forEach(user => {
        let mark = row.get(user); // "〇", "△", "×", undefined 等

        if (mark && /\d+-\d+/.test(mark)) mark = '□';

        // 詳細データに保存 (空白の場合は '-' にする等も可能)
        availabilityDetails[user] = mark || '-';

        // 集計ロジック (〇と△をカウント)
        // 必要に応じて 'OK' など他の文字も条件に追加してください
        if (mark === '〇' || mark === '△'|| mark === '▽' || mark === '✕') {
          availableCount++;
        }
        /*
        else if(/\d/.test(mark)) {
          availableCount += parseInt(mark);
        }
          */

      });

      return {
        date: dateVal,
        count: availableCount,
        details: availabilityDetails,
        users: userColumns // カラム名リストもViewに渡す
      };
    });

    return data;

  } catch (error) {
    console.error("Spreadsheet Load Error:", error);
    return [];
  }
}

// ---------------------------------------------------------
// ルーティング
// ---------------------------------------------------------

// ホームページ表示 (GET /)
app.get('/', async (req, res) => {
  const data = await getSheetData();
  // views/index.ejs にデータを渡す
  res.render('index', { items: data });
});

// GAS等からのWake用アクセス (POST /)
app.post('/', (req, res) => {
  const type = req.body.type;
  if (type === "wake") {
    console.log("Woke up in post");
  } else {
    console.log("Received POST:", type);
  }
  res.status(200).end();
});

// ====================================================
// サーバー起動
// ====================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Web Server running on port ${PORT}`);
});

// Discord BotのTokenチェック
if (!process.env.DISCORD_BOT_TOKEN) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
}

// Bot本体の起動
try {
  require("./code.js");
} catch (e) {
  console.error("Bot起動エラー:", e);
}