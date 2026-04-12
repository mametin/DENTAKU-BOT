const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const path = require("path");
const cors = require("cors");

//ヘルスチェック用
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors());
app.use(express.json());

// ====================================================
// 設定・定数
// ====================================================
// スプレッドシートID
const SPREADSHEET_ID = "1wx0ezY3Vdad7z09KESFhN_sCMeSKaaGWlkH2To1cOiw";

// ヘッダー行のインデックス (ユーザー名)
const HEADER_ROW_INDEX = 4;

// GASのURL
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbytDVAVE1488ftKB3LCPNXILV3yLjuVT01IINEb6eaLv0RCvDZ_VdypRjV03esCZtQ4/exec";

// ====================================================
// ヘルスチェック用
// ====================================================
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Web Server running on port ${PORT}`);
});

// ====================================================
// React用エンドポイント
// ====================================================
app.get("/api/data", async (req, res) => {
  try {
    const data = await getSheetData();
    res.json(data);
  } catch (error) {
    console.error("APIデータ取得エラー:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post("/api/auth/discord", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Auth failed" });
  }
});

// ====================================================
// データ取得関数
// ====================================================
async function getSheetData() {
  try {
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY
    ) {
      console.log("認証情報が設定されていません。");
      return { last: [], current: [], next: [] };
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const s = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await s.loadInfo();

    const sheetConfigs = [
      { index: 0, label: "last" }, // 先月
      { index: 1, label: "current" }, // 今月
      { index: 2, label: "next" }, // 来月
    ];

    const result = { last: [], current: [], next: [] };

    for (const config of sheetConfigs) {
      const sheet = s.sheetsByIndex[config.index];
      if (!sheet) continue;

      await sheet.loadHeaderRow(HEADER_ROW_INDEX);
      const rows = await sheet.getRows();
      const allHeaders = sheet.headerValues;

      const userColumns = allHeaders.filter(
        (header) =>
          header !== "日付" &&
          header !== "Date" &&
          header !== "曜日" &&
          header !== "" &&
          header !== undefined,
      );

      const data = rows.map((row) => {
        const dateVal = row.get("日付") || row.get("Date") || "日付不明";
        const dayVal = row.get("曜日") || "";

        const availabilityDetails = {};
        userColumns.forEach((user) => {
          const val = row.get(user);
          availabilityDetails[user] =
            val === null || val === undefined ? "-" : String(val);
        });

        return {
          date: dateVal,
          day: dayVal,
          details: availabilityDetails,
        };
      });

      result[config.label] = data;
    }

    return result;
  } catch (error) {
    console.error("Spreadsheet Load Error:", error);
    return { last: [], current: [], next: [] };
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
