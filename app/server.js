const express = require("express");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const app = express();
const port = process.env.PORT || 8080;

// Discord Botの起動
require("./code.js");

// Google Sheets 設定
const SPREADSHEET_ID = 'あなたのスプレッドシートID';
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

app.set("view engine", "ejs");
app.set("views", "./app/views"); // viewsフォルダを作成してください

// メインページ：スプレッドシートのデータを集計して表示
app.get("/", async (req, res) => {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // 最初のシート
    const rows = await sheet.getRows();
    
    // 集計ロジック（例：日付ごとの◯と△をカウント）
    // rows[i].get('日付') や rows[i].get('PL1') でアクセス
    let scheduleData = rows.map(row => {
      let okCount = 0;
      let maybeCount = 0;
      // PL1からPL15までをループ（プロパティ名はシートのヘッダーに依存）
      for(let i=1; i<=15; i++) {
        const status = row.get(`PL${i}`);
        if(status === '〇') okCount++;
        if(status === '△') maybeCount++;
      }
      return {
        date: row.get('日付'),
        ok: okCount,
        maybe: maybeCount
      };
    });

    res.render("index", { schedules: scheduleData });
  } catch (error) {
    console.error(error);
    res.send("データ読み込みエラー");
  }
});

// GASのWakeup用（既存のPOST処理を維持）
app.post("/", express.urlencoded({ extended: true }), (req, res) => {
  if (req.body.type === "wake") {
    console.log("Woke up via POST");
  }
  res.end();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});