// --- 入力フォームコンポーネント---
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TimeSlotModal from "./TimeSlotModal";
import headerIcon from "../IMG_icon.jpg";
import { GAS_URL, DISCORD_URL } from "../constants";

function EntryForm({ allData }) {
  const navigate = useNavigate();

  //URLから対象月を取得
  const queryParams = new URLSearchParams(window.location.search);
  const initialMonth = queryParams.get("month") || "current";
  const [formMonth, setFormMonth] = useState(initialMonth);

  const items = allData[formMonth] || [];

  // localStorage からログイン情報を取得
  const savedUser = localStorage.getItem("discord_user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [selectedValues, setSelectedValues] = useState(() => {
    const initial = {};
    items.forEach((item) => {
      initial[item.date] = "-";
    });
    return initial;
  });

  // usestateの定義
  const { targetName } = useParams();
  const [name, setName] = useState(targetName || "");
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [responses, setResponses] = useState({});
  const [otherTexts, setOtherTexts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [editingDate, setEditingDate] = useState(null);

  const [bulkMode, setBulkMode] = useState("all"); // "all" or "day"
  const [targetDay, setTargetDay] = useState("mon"); // 曜日選択
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // useEffectの定義
  // Discord認証後のリダイレクト処理と、ログイン状態の確認
  useEffect(() => {
    const savedUser = localStorage.getItem("discord_user");
    if (!savedUser && !targetName) {
      window.location.href = DISCORD_URL;
      return;
    }
    if (savedUser && !targetName) {
      const userData = JSON.parse(savedUser);
      setName(userData.username);
    }
  }, [targetName]);

  // 編集モードのとき、既存データをフォームにセット
  useEffect(() => {
    if (targetName && items && items.length > 0) {
      // itemsの存在チェックを追加
      const decodedName = decodeURIComponent(targetName);
      const resObj = {};
      const otherObj = {};
      let userComment = "";

      items.forEach((item) => {
        const val = item.details[decodedName] || "";
        const cleanVal = val === "-" ? "" : val;

        if (item.date === "コメント") {
          userComment = cleanVal;
        } else if (item.details && item.details[decodedName]) {
          const marks = ["◎", "△", "▽", "✕", ""];
          if (cleanVal && !marks.includes(cleanVal)) {
            resObj[item.date] = "その他";
            otherObj[item.date] = cleanVal;
          } else {
            resObj[item.date] = cleanVal;
          }
        }
      });

      setResponses(resObj);
      setOtherTexts(otherObj);
      setComment(userComment);

      setInitialData(
        JSON.stringify({
          name: decodedName,
          responses: resObj,
          otherTexts: otherObj,
          comment: userComment,
        }),
      );
    }
  }, [targetName, items]);

  if (!items || items.length === 0) {
    return (
      <div className="container">
        <div className="full-screen-loading">
          <div className="loader"></div>
          データを読み込み中...
        </div>
      </div>
    );
  }

  const boundaryIndex = items.findIndex(
    (item) => !item.date || item.date.trim() === "" || item.date === "日付不明",
  );

  const validItems =
    boundaryIndex === -1 ? items : items.slice(0, boundaryIndex);
  const dates = validItems.map((item) => item.date);

  // 一括更新のハンドラ
  const handleBulkUpdate = (status) => {
    const newResponses = { ...responses };
    dates.forEach((date) => {
      const item = items.find((i) => i.date === date);
      const match = date.match(/\((.)\)/);
      const day = match ? match[1] : null;

      if (bulkMode === "day" && day !== targetDay) return; // 曜日指定モードで、対象外の日はスキップ
      if (!overwriteExisting && newResponses[date]) return; // 上書き禁止で、すでに入力がある日はスキップ
      newResponses[date] = status;
    });

    setResponses(newResponses);
  };

  // ラジオボタンの変更ハンドラ
  const handleRadioChange = (date, value) => {
    setResponses({ ...responses, [date]: value });
  };

  // 「その他」のテキスト入力ハンドラ
  const handleOtherTextChange = (date, text) => {
    setOtherTexts({ ...otherTexts, [date]: text }); // 記述内容を保存
    setResponses({ ...responses, [date]: "その他" }); // 「他」のテキストを入力したら、自動的にその日の選択を「その他」に設定
  };

  //セレクトボックスの変更ハンドラ
  const handleSelectChange = (date, value) => {
    if (value === "その他") {
      setEditingDate(date);
      setResponses((prev) => ({ ...prev, [date]: "その他" }));
    } else {
      setResponses((prev) => ({ ...prev, [date]: value }));
      setOtherTexts((prev) => {
        const newOther = { ...prev };
        delete newOther[date];
        return newOther;
      });
    }
  };

  const buttonOptions = [
    { label: "◎", value: "◎" },
    { label: "△", value: "△" },
    { label: "▽", value: "▽" },
    { label: "✕", value: "✕" },
    { label: "他", value: "その他" },
  ];

  const handleOptionClick = (date, value) => {
    if (value === "その他") {
      setEditingDate(date);
      setResponses((prev) => ({ ...prev, [date]: "その他" }));
    } else {
      setResponses((prev) => ({ ...prev, [date]: value }));
      // 「その他」以外なら詳細テキストを消去
      setOtherTexts((prev) => {
        const newOther = { ...prev };
        delete newOther[date];
        return newOther;
      });
    }
  };

  // modalで時間帯を保存したときのハンドラ
  const handleSaveTimeSlots = (date, formattedString) => {
    if (formattedString) {
      setOtherTexts((prev) => ({ ...prev, [date]: formattedString }));
    } else {
      setOtherTexts((prev) => ({ ...prev, [date]: "その他" }));
    }
    setEditingDate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ログイン情報の再確認
    if (!user) {
      alert("ログイン情報が見つかりません。再度ログインしてください。");
      return;
    }

    const currentData = JSON.stringify({
      name,
      responses,
      otherTexts,
      comment,
    });
    if (initialData && initialData === currentData) {
      alert("変更箇所がありません。");
      return;
    }

    if (isSubmitting) return; // 二重送信防止
    setIsSubmitting(true);

    // 送信用にデータを整形
    const finalResponses = { ...responses };
    dates.forEach((date) => {
      if (finalResponses[date] === "その他") {
        finalResponses[date] = otherTexts[date] || "未入力";
      }
    });

    const submissionResponses = {};
    validItems.forEach((item) => {
      const datekey = item.date;
      const val = responses[datekey];

      if (val === "その他") {
        submissionResponses[datekey] = otherTexts[datekey] || "";
      } else {
        submissionResponses[datekey] = val || ""; // 未選択なら ""
      }
    });

    const userIdRow = items.find((item) => item.date === "ユーザID");
    let submidID = user.id;

    if (targetName) {
      const decodeName = decodeURIComponent(targetName);
      if (userIdRow && userIdRow.details && userIdRow.details[decodeName]) {
        submidID = decodeName;
      }
    }

    const payload = {
      type: targetName ? "correct" : "submit",
      id: submidID,
      name: name,
      comment: comment,
      responses: finalResponses,
      targetMonth: formMonth,
    };

    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      alert("送信処理を受け付けました！");
      navigate("/");
      window.location.reload();
    } catch (err) {
      console.error("送信エラー:", err);
      alert("送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-left">
          <div className="header-icon"></div>
          <h1 className="header-title">
            <img src={headerIcon} alt="Icon" className="title-icon" />
            日程調整くんWEB
          </h1>
        </div>

        <div className="header-right">
          {/* --- ログインバナー --- */}
          {user ? (
            <div className="user-banner">
              <img src={user.avatar} alt="avatar" className="avatar-img" />
              <span className="username-text">{user.username}</span>
            </div>
          ) : (
            <div className="user-banner">
              <div className="guest-icon">
                <span className="material-icons"></span>{" "}
              </div>
              <span className="username-text" style={{ color: "#666" }}>
                ゲスト閲覧中
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="container">
        <div className="white-box">
          <form onSubmit={handleSubmit}>
            <div className="input-header-area">
              <div className="input-info">
                <div className="tab-container" style={{ marginBottom: "15px" }}>
                  <button
                    type="button"
                    onClick={() => setFormMonth("current")}
                    className={formMonth === "current" ? "active" : ""}
                  >
                    今月
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMonth("next")}
                    className={formMonth === "next" ? "active" : ""}
                  >
                    来月
                  </button>
                </div>

                <h1>日程の{targetName ? "修正" : "新規入力"}</h1>
                <div className="form-group">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span className="textbox-name-label">名前：</span>
                    <input
                      className="textbox-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bulk-update-panel">
                <div className="bulk-controls-top">
                  <select
                    value={bulkMode}
                    onChange={(e) => setBulkMode(e.target.value)}
                    className="bulk-select"
                  >
                    <option value="all">全日程を一括変更</option>
                    <option value="day">曜日を指定して変更</option>
                  </select>

                  <label className="overwrite-checkbox">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                    />
                    入力済みを上書き
                  </label>
                </div>

                <div className="bulk-controls-bottom">
                  {bulkMode === "day" && (
                    <div className="day-selector">
                      {["月", "火", "水", "木", "金", "土", "日"].map(
                        (d, index) => (
                          <div className="radio-area" key={`bulk-day-${index}`}>
                            <input
                              type="radio"
                              name="targetDay"
                              id={`day-${index}`}
                              value={d}
                              checked={targetDay === d}
                              onChange={(e) => setTargetDay(e.target.value)}
                            />
                            <label htmlFor={`day-${index}`}>{d}</label>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="bulk-action-buttons">
                    {["◎", "△", "▽", "✕"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleBulkUpdate(status)}
                        className={`btn-bulk ${status}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className="date-list">
              <h3>日程選択</h3>
              {dates.map((date) => (
                <div className="date-item-container" key={date}>
                  <span className="date-label-text">{date}</span>

                  <div className="right-content">
                    <div className="options-group">
                      {[
                        { val: "◎", label: "ok", mark: "mark-◎" },
                        { val: "△", label: "tri", mark: "mark-△" },
                        { val: "▽", label: "rev", mark: "mark-▽" },
                        { val: "✕", label: "ng", mark: "mark-✕" },
                      ].map((opt) => (
                        <React.Fragment key={opt.val}>
                          <input
                            type="radio"
                            id={`${opt.label}_${date}`}
                            name={`date_${date}`}
                            value={opt.val}
                            checked={responses[date] === opt.val}
                            onChange={() => {
                              handleRadioChange(date, opt.val);
                              setOtherTexts((prev) => {
                                const newOther = { ...prev };
                                delete newOther[date];
                                return newOther;
                              });
                            }}
                          />
                          <label
                            htmlFor={`${opt.label}_${date}`}
                            className="option-label"
                          >
                            <span className={opt.mark}>{opt.val}</span>
                          </label>
                        </React.Fragment>
                      ))}

                      <input
                        type="radio"
                        id={`other_radio_${date}`}
                        name={`date_${date}`}
                        value="その他"
                        checked={responses[date] === "その他"}
                        onChange={() => {
                          handleRadioChange(date, "その他");
                          setEditingDate(date);
                        }}
                      />
                      <label
                        htmlFor={`other_radio_${date}`}
                        className="option-label"
                      >
                        他
                      </label>
                    </div>

                    {responses[date] === "その他" &&
                      otherTexts[date] &&
                      otherTexts[date] !== "その他" && (
                        <div className="time-tag-container">
                          {otherTexts[date].split(",").map((slot, idx) => (
                            <span
                              key={idx}
                              className="time-tag"
                              onClick={() => setEditingDate(date)}
                            >
                              {slot.replace("-", " 〜 ")}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>
                <span className="textbox-name-label">コメント：</span>
                <input
                  className="textbox-coment"
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
            </div>

            <div className="submit-box" style={{ marginTop: "50px" }}>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "送信中..." : "送信"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/")}
              >
                キャンセル
              </button>
            </div>
          </form>

          {editingDate && (
            <TimeSlotModal
              date={editingDate}
              initialValue={otherTexts[editingDate]}
              onSave={(date, val) => {
                setOtherTexts((prev) => ({ ...prev, [date]: val }));
                setEditingDate(null);
              }}
              onClose={() => {
                // もし既に時刻が入っているならそのまま、
                // 何も入っていない状態でキャンセルしたなら選択を解除する
                if (!otherTexts[editingDate]) {
                  setResponses((prev) => ({ ...prev, [editingDate]: "" }));
                }
                setEditingDate(null);
              }}
            />
          )}
        </div>
      </div>

      <footer className="site-footer">
        <h1 className="text">DENTAKU</h1>
        <h2 className="text2">
          &copy; 2026 日程調整カレンダー All Rights Reserved.
        </h2>
        <h2 className="text3">-POWERED BY まめとろ(@sndu_mame)-</h2>
      </footer>
    </div>
  );
}

export default EntryForm;