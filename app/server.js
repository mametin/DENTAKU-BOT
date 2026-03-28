const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

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
    const data = rows.map(row => {
      const dateVal = row.get('日付') || row.get('Date') || '日付不明';

      let availableCount = 0;
      const availabilityDetails = {};

      userColumns.forEach(user => {
        let mark = row.get(user);

        if (mark && /\d+-\d+/.test(mark)) mark = '□';

        availabilityDetails[user] = mark || '-';

        if (mark === '〇' || mark === '△'|| mark === '▽' || mark === '✕') {
          availableCount++;
        }
      });

      return {
        date: dateVal,
        count: availableCount,
        details: availabilityDetails,
        users: userColumns
      };
    });

    return data;

  } catch (error) {
    console.error("Spreadsheet Load Error:", error);
    return [];
  }
}

// ====================================================
// Bot本体の起動
// ====================================================
// Discord BotのTokenチェック
if (!process.env.DISCORD_BOT_TOKEN) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
}

try {
  require("./bot/code.js");
} catch (e) {
  console.error("Bot起動エラー:", e);
}