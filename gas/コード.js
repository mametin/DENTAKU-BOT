/* 定数 */
const NAME_ROW = 4;      // 名前を書き込む行
const DATA_START_ROW = 5; // 回答を開始する行
const INSERT_COL = 8;    // 挿入する位置

const INSERT_COMMENT_ROW = 37;  //コメント行

const DAY_START_ROW = 5;  //日付開始行
const DAY_START_COL = 2;  //日付開始列

const USER_ID_ROW = 40;   //ユーザID行

function getRequiredSheet(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('シートが見つかりません: ' + name);
  return sheet;
}

function getInputSheet(ss, targetMonth) {
  if (!["current", "next", "next2"].includes(targetMonth)) {
    throw new Error('対象月が不正です: ' + targetMonth);
  }
  return getRequiredSheet(ss, targetMonth);
}

/* アクセスポイント */
function doPost(e) {
  const postData = JSON.parse(e.postData.contents);

  if (postData.code) {
    return handleDiscordAuth(e);
  }

  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.type) {
      case "submit":
        return inputNewDate(data);
      case "correct":
        return inputCorrectDate(data);
      default:
        return createResponse({ status: "error", message: "Unknown type" });
    }
  } catch (err) {
    return createResponse({ status: "error", message: err.toString() });
  }
}

/* レスポンス作成関数 */
function createResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}


//==========================================================
//日程を新規入力
//==========================================================
function inputNewDate(data) {
  const ss = SpreadsheetApp.openById('1wx0ezY3Vdad7z09KESFhN_sCMeSKaaGWlkH2To1cOiw');
  const sheet = getInputSheet(ss, data.targetMonth);

  const userName = data.name;
  const userID = data.id;
  const userComment = data.comment;
  const userResponses = data.responses;
  const dateKeys = Object.keys(userResponses);

  sheet.insertColumns(INSERT_COL, 1);

  sheet.getRange(NAME_ROW, INSERT_COL).setValue(userName);

  const responseValues = dateKeys.map(key => [userResponses[key]]);

  if (responseValues.length > 0) sheet.getRange(DATA_START_ROW, INSERT_COL, responseValues.length, 1).setValues(responseValues);

  //ユーザIDの入力
  if (userID) {
    sheet.getRange(USER_ID_ROW, INSERT_COL).setValue(userID);
  }

  //コメント文
  if (userComment) {
    sheet.getRange(INSERT_COMMENT_ROW, INSERT_COL).setValue(userComment);
  }

  return createResponse({ status: "success", message: "登録完了" });
}

//==========================================================
//日程の修正
//==========================================================
function inputCorrectDate(data) {
  const ss = SpreadsheetApp.openById('1wx0ezY3Vdad7z09KESFhN_sCMeSKaaGWlkH2To1cOiw');
  const sheet = getInputSheet(ss, data.targetMonth);

  const userName = data.name;
  const userID = data.id; // Reactから送られてくるIDを使用
  const userComment = data.comment;
  const userResponses = data.responses;

  const lastCol = sheet.getLastColumn();

  const idRowValues = sheet.getRange(USER_ID_ROW, 1, 1, lastCol).getValues()[0];
  let targetCol = idRowValues.indexOf(userID) + 1;


  if (targetCol <= 0) {
    const nameRowValues = sheet.getRange(NAME_ROW, 1, 1, lastCol).getValues()[0];
    targetCol = nameRowValues.indexOf(userName) + 1;
  }

  if (targetCol <= 0) return createResponse({ status: "error", message: "User not found for correction." });

  const totalRows = sheet.getLastRow();
  const numRows = totalRows - DAY_START_ROW + 1;

  const dateColumnValues = sheet.getRange(DAY_START_ROW, DAY_START_COL, numRows, 1).getDisplayValues();
  const currentData = sheet.getRange(DAY_START_ROW, targetCol, numRows, 1).getValues();
  let writeData = new Array(numRows);

  for (let i = 0; i < dateColumnValues.length; i++) {
    const rowTitle = dateColumnValues[i][0].trim();

    if (userResponses[rowTitle] !== undefined) {
      writeData[i] = [userResponses[rowTitle]];
    } else {
      writeData[i] = [currentData[i][0]];
    }
  }

  sheet.getRange(DAY_START_ROW, targetCol, writeData.length, 1).setValues(writeData);

  sheet.getRange(NAME_ROW, targetCol).setValue(userName);
  //sheet.getRange(USER_ID_ROW, targetCol).setValue(userID);

  sheet.getRange(INSERT_COMMENT_ROW, targetCol).setValue(userComment);

  return createResponse({ status: "success", message: "修正完了" });
}
