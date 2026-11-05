// ------------------------------------
// 毎月n日にカレンダーに変更を加えるトリガー
// current → last、next → current、next2 → next、copy → next2
//

const MONTH_CELL = 'C2';      // 月記載セル

// トリガー
function monthlyTrigger() {
  const ss = SpreadsheetApp.openById('1wx0ezY3Vdad7z09KESFhN_sCMeSKaaGWlkH2To1cOiw');
  // 消去前に、テンプレートを含めた全シートの存在を確認する。
  const sheets = ['last', 'current', 'next', 'next2', 'copy']
    .map(name => getRequiredSheet(ss, name));

  // コピー元の列数は回答者の追加により増えるため、先に領域を確保する。
  for (let i = 0; i < 4; i++) {
    const source = sheets[i + 1].getDataRange();
    const target = sheets[i];
    if (target.getMaxRows() < source.getNumRows()) {
      target.insertRowsAfter(target.getMaxRows(), source.getNumRows() - target.getMaxRows());
    }
    if (target.getMaxColumns() < source.getNumColumns()) {
      target.insertColumnsAfter(target.getMaxColumns(), source.getNumColumns() - target.getMaxColumns());
    }
  }

  for (let i = 0; i < 4; i++) {
    sheets[i].clear();
    sheets[i + 1].getDataRange().copyTo(sheets[i].getRange(1, 1));
  }

  // 年越しでも月を1〜12に収める。copyは変更しない。
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 4; i++) {
    sheets[i].getRange(MONTH_CELL).setValue((currentMonth + i + 11) % 12 + 1);
  }

}


// -------------------------------------------------
// 月初めにリマインドembedメッセージをDiscordに送信
// -------------------------------------------------
function postMessage_Monthlyreset(msg) {
  const webhook = "https://discord.com/api/webhooks/1499079066056392804/kBFVHgx1wmXxLx8oDUAUjQeYzhvXZfNgAPNtFzNiD7lBXF_KVpY9aA_yNCGclxJ6R5hq";

  const date = new Date();
  const targetMonthStr = `${date.getFullYear()}年${date.getMonth() + 1}月分`;

  const colorCode = parseInt("EACF1B", 16);
  const message = {
    "tts": false,
    "content": "@everyone 【リマインド】来月の予定を入力しましょう！",
    "embeds": [
      {
        "title": `日程調整くんWEB (${targetMonthStr})`,
        "url": "https://dentaku-bot.vercel.app/?month=next",
        "color": colorCode,
        "description": "来月分の予定は早めの入力を心がけよう！",
      }
    ]
  };
  const param = {
    "method": "POST",
    "headers": { "Content-type": "application/json" },
    "payload": JSON.stringify(message)
  };
  UrlFetchApp.fetch(webhook, param);
}
