import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import { useParams } from "react-router-dom";
import TimeSlotModal from "./TimeSlotModal";

import headerIcon from "./IMG_icon.jpg";
// ====================================================
// 各種定数
// ====================================================
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbytDVAVE1488ftKB3LCPNXILV3yLjuVT01IINEb6eaLv0RCvDZ_VdypRjV03esCZtQ4/exec";
const DISCORD_URL =
  "https://discord.com/oauth2/authorize?client_id=1263473828319989772&response_type=code&redirect_uri=https%3A%2F%2Fdentaku-bot.vercel.app%2Fcallback&scope=identify";
const loginWithDiscord = () => {
  window.location.href = DISCORD_URL;
};

// --- カレンダー表示コンポーネント ---
function CalendarView({ allData }) {
  const navigate = useNavigate();

  // タブの状態管理
  const [activeTab, setActiveTab] = useState(1);
  const [activeMonth, setActiveMonth] = useState("current");
  const items = allData[activeMonth] || [];

  // localStorage からログイン情報を取得
  const savedUser = localStorage.getItem("discord_user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  // フィルタ状態の管理
  const [filterConfig, setFilterConfig] = useState({
    type: null, // "user", "day", "date"
    selectedUsers: [],
    hideUnanswered: true, // 未回答を非表示にするか
    matchTypes: "anyone_x", // "all_ok","anyone_x"
  });

  // フィルタ用モーダルの状態管理
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // フィルタ解除関数
  const resetFilter = () => {
    setFilterConfig({
      type: null,
      selectedUsers: [],
      hideUnanswered: true,
      matchTypes: "anyone_x",
    });
  };

  // フィルタ選択モーダルを開くハンドラ
  const handleSortChange = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === "user") {
      setIsFilterModalOpen(true);
    }
    // 今後、'day' や 'date' もここで分岐させます
  };

  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      localStorage.removeItem("discord_user");
      window.location.reload(); // 状態をリセット
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="full-screen-loading">
        <div className="loader"></div>
        データを読み込み中...
      </div>
    );
  }

  // コメント行を取得
  const commentRow = items.find((item) => item.date === "コメント");

  // --- ユーザー名のリストを取得 ---
  const allKeysSet = new Set();
  items.forEach((item) => {
    if (item.details) {
      Object.keys(item.details).forEach((key) => allKeysSet.add(key));
    }
  });

  const excludedMarks = ["◎", "△", "▽", "✕", "☐", "◎", "✕", "☐", ""];
  const allUserNames = Array.from(allKeysSet).filter(
    (key) => !excludedMarks.includes(key),
  );

  const isAlreadyAnswered = user && allUserNames.includes(user.username);

  // 3. 表示する列（カラム）を決定
  const displayColumns =
    filterConfig.type === "user" && filterConfig.selectedUsers.length > 0
      ? filterConfig.selectedUsers
      : allUserNames;

  // 3. 表示する行（日付）をフィルタリング
  const boundaryIndex = items.findIndex(
    (item) => !item.date || item.date.trim() === "" || item.date === "日付不明",
  );
  const calendarItems =
    boundaryIndex === -1 ? items : items.slice(0, boundaryIndex);

  const displayRow = calendarItems.filter((item) => {
    if (
      filterConfig.type !== "user" ||
      filterConfig.selectedUsers.length === 0
    ) {
      return true;
    }

    const targetStatuses = filterConfig.selectedUsers.map(
      (u) => item.details?.[u],
    );

    // 指定日が未回答(-)のユーザーを除外する判定
    if (filterConfig.hideUnanswered && targetStatuses.some((s) => s === "-")) {
      return false;
    }

    // ✕ に関する判定
    if (
      filterConfig.matchTypes === "anyone_x" &&
      targetStatuses.includes("✕")
    ) {
      return false;
    }
    if (
      filterConfig.matchTypes === "all_x" &&
      targetStatuses.every((s) => s === "✕")
    ) {
      return false;
    }

    return true;
  });

  console.log("1. 届いた全データ:", items);
  console.log(
    "2. 最初の行のdetails:",
    items.length > 0 ? items[0].details : "データなし",
  );
  console.log("3. 抽出されたユーザー名:", allUserNames);

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
          <nav className="header-menu">
            <ul>
              {/* 入力ボタン */}
              {isAlreadyAnswered ? (
                <li>
                  <Link
                    to={`/edit/${encodeURIComponent(user.username)}?month=${activeMonth === "last" ? "current" : activeMonth}`}
                    className="btn-new"
                  >
                    入力の編集
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    to={`/new?month=${activeMonth === "last" ? "current" : activeMonth}`}
                    className="btn-new"
                  >
                    新規入力
                  </Link>
                </li>
              )}

              {/* カレンダーへのリンク */}
              <li>
                <a
                  href="https://calendar.google.com/calendar/u/0/embed?src=mamebot0705@gmail.com&ctz=Asia/Tokyo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-item"
                >
                  カレンダー
                </a>
              </li>

              {/* ヘルプサイトへのリンク */}
              <li>
                <Link to="/help" className="btn-help">
                  ヘルプ
                </Link>
              </li>
            </ul>
          </nav>

          {/* --- ログインバナー --- */}
          {user ? (
            <div className="user-banner">
              <img src={user.avatar} alt="avatar" className="avatar-img" />
              <span className="username-text">
                {user.username} としてログイン中
              </span>
              <button onClick={handleLogout} className="btn-logout">
                ログアウト
              </button>
            </div>
          ) : (
            <div className="user-banner">
              <div className="guest-icon">
                <span className="material-icons"></span>{" "}
              </div>
              <span className="username-text" style={{ color: "#666" }}>
                ゲスト閲覧中
              </span>
              <button
                onClick={loginWithDiscord}
                className="user-edit-link"
                style={{
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  transform: "skew(25deg)",
                }}
              >
                ログイン
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container">
        <UserFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          userList={allUserNames}
          currentConfig={filterConfig}
          onApply={(config) => {
            setFilterConfig(config);
            setIsFilterModalOpen(false);
          }}
        />

        <div className="white-box">
          <div className="calendar-controls">
            <div className="controls-left-group">
              <h2 className="heading">カレンダー</h2>
              <div className="box-calendar-explanation">
                新規入力にはDiscordのアカウント認証が必要です。
                <br />
                ☐にカーソルを合わせると、時間帯の詳細が表示されます。
                <br />
              </div>
              <div className="tab-container">
                <button
                  onClick={() => {
                    setActiveTab(0);
                    setActiveMonth("last");
                  }}
                  className={activeTab === 0 ? "active" : ""}
                >
                  前月
                </button>
                <button
                  onClick={() => {
                    setActiveTab(1);
                    setActiveMonth("current");
                  }}
                  className={activeTab === 1 ? "active" : ""}
                >
                  今月
                </button>
                <button
                  onClick={() => {
                    setActiveTab(2);
                    setActiveMonth("next");
                  }}
                  className={activeTab === 2 ? "active" : ""}
                >
                  来月
                </button>
              </div>
            </div>

            <div className="controls-right-group">
              <div className="box-explanation">
                ◎：全日可
                <br />
                △：日中(9:00~18:00)
                <br />
                ▽：夜中(20:00~24:00)
                <br />
                ✕：不可 <br />
                ☐：時間指定（クリックで詳細表示）
              </div>

              <div className="filter-controls">
                <label className="box-sort">
                  <select
                    className="selectbox-sort"
                    onChange={handleSortChange}
                  >
                    <option value="">使用禁止</option>
                    <option value="user">ユーザーで絞り込む</option>
                    <option value="day">曜日で絞り込む</option>
                    <option value="date">日付で絞り込む</option>
                  </select>
                </label>
                {filterConfig.type && (
                  <button className="btn-resetFilter" onClick={resetFilter}>
                    ✕
                  </button>
                )}
              </div>

              {filterConfig.type === "user" && (
                <div className="filter-status-badge">
                  絞り込み中: {filterConfig.selectedUsers.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/*先月のカレンダーを表示*/}
          {activeTab === 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th className="stat-header">◎</th>
                    <th className="stat-header">△</th>
                    <th className="stat-header">▽</th>
                    <th className="stat-header">✕</th>
                    <th className="stat-header">☐</th>

                    {displayColumns.map((user) => (
                      <th key={user}>
                        <Link
                          to={`/edit/${encodeURIComponent(user)}`}
                          className="user-edit-link"
                        >
                          {user}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRow.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date}</td>

                      <td>{item.details?.["◎"] || 0}</td>
                      <td>{item.details?.["△"] || 0}</td>
                      <td>{item.details?.["▽"] || 0}</td>
                      <td>{item.details?.["✕"] || 0}</td>
                      <td>{item.details?.["☐"] || 0}</td>

                      {displayColumns.map((u) => {
                        const val = item.details?.[u] || "-";
                        const isTimeValue = /\d+-\d+/.test(val);

                        return (
                          <td
                            key={u}
                            className={`mark-${isTimeValue ? "☐" : val}`}
                          >
                            {isTimeValue ? (
                              <div className="tooltip-container">
                                <div className="tooltip-trigger">☐</div>
                                <span className="tooltip-content">{val}</span>
                              </div>
                            ) : (
                              val
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/*今月のカレンダーを表示*/}
          {activeTab === 1 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th className="stat-header">◎</th>
                    <th className="stat-header">△</th>
                    <th className="stat-header">▽</th>
                    <th className="stat-header">✕</th>
                    <th className="stat-header">☐</th>

                    {displayColumns.map((user) => (
                      <th key={user}>
                        <Link
                          to={`/edit/${encodeURIComponent(user)}`}
                          className="user-edit-link"
                        >
                          {user}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRow.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date}</td>

                      <td>{item.details?.["◎"] || 0}</td>
                      <td>{item.details?.["△"] || 0}</td>
                      <td>{item.details?.["▽"] || 0}</td>
                      <td>{item.details?.["✕"] || 0}</td>
                      <td>{item.details?.["☐"] || 0}</td>

                      {displayColumns.map((u) => {
                        const val = item.details?.[u] || "-";
                        const isTimeValue = /\d+-\d+/.test(val);

                        return (
                          <td
                            key={u}
                            className={`mark-${isTimeValue ? "☐" : val}`}
                          >
                            {isTimeValue ? (
                              <div className="tooltip-container">
                                <div className="tooltip-trigger">☐</div>
                                <span className="tooltip-content">{val}</span>
                              </div>
                            ) : (
                              val
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/*来月のカレンダーを表示*/}
          {activeTab === 2 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th className="stat-header">◎</th>
                    <th className="stat-header">△</th>
                    <th className="stat-header">▽</th>
                    <th className="stat-header">✕</th>
                    <th className="stat-header">☐</th>

                    {displayColumns.map((user) => (
                      <th key={user}>
                        <Link
                          to={`/edit/${encodeURIComponent(user)}`}
                          className="user-edit-link"
                        >
                          {user}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRow.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date}</td>

                      <td>{item.details?.["◎"] || 0}</td>
                      <td>{item.details?.["△"] || 0}</td>
                      <td>{item.details?.["▽"] || 0}</td>
                      <td>{item.details?.["✕"] || 0}</td>
                      <td>{item.details?.["☐"] || 0}</td>

                      {displayColumns.map((u) => {
                        const val = item.details?.[u] || "-";
                        const isTimeValue = /\d+-\d+/.test(val);

                        return (
                          <td
                            key={u}
                            className={`mark-${isTimeValue ? "☐" : val}`}
                          >
                            {isTimeValue ? (
                              <div className="tooltip-container">
                                <div className="tooltip-trigger">☐</div>
                                <span className="tooltip-content">{val}</span>
                              </div>
                            ) : (
                              val
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {commentRow && (
          <div className="white-box">
            <div className="comment-section">
              <div className="comment-box">
                {" "}
                <h2 className="comment-title">コメント</h2>{" "}
              </div>
              <ol className="comment-list" style={{ paddingLeft: "20px" }}>
                {allUserNames.map(
                  (user) =>
                    commentRow.details[user] &&
                    commentRow.details[user] !== "-" &&
                    commentRow.details[user].trim() !== "" && (
                      <li
                        key={user}
                        className="comment-item"
                        style={{ marginBottom: "10px" }}
                      >
                        <span style={{ fontWeight: "bold" }}>{user}</span>：{" "}
                        {commentRow.details[user]}
                      </li>
                    ),
                )}
              </ol>
            </div>
          </div>
        )}
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
// --- 入力フォームコンポーネント---
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
      const dateKey = item.date;
      const val = responses[dateKey];

      if (val === "その他") {
        submissionResponses[dateKey] = otherTexts[dateKey] || "";
      } else {
        submissionResponses[dateKey] = val || ""; // 未選択なら ""
      }
    });

    const payload = {
      type: targetName ? "correct" : "submit",
      id: user.id,
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
              <span className="username-text">
                {user.username} としてログイン中
              </span>
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

// --- フィルター設定モーダルを作成するコンポーネント ---
function UserFilterModal({
  isOpen,
  onClose,
  userList,
  onApply,
  currentConfig,
}) {
  // モーダル内での一時的な状態
  const [tmpUsers, setTmpUsers] = useState(currentConfig.selectedUsers);
  const [tmpHide, setTmpHide] = useState(currentConfig.hideUnanswered);
  const [tmpMatch, setTmpMatch] = useState(currentConfig.matchTypes);

  if (!isOpen) return null;

  const handleToggleUser = (user) => {
    setTmpUsers((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user],
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content filter-modal">
        <h3>表示するユーザーを選択</h3>

        <div className="user-checkbox-list">
          {userList.map((user) => (
            <label key={user} className="checkbox-item">
              <input
                type="checkbox"
                checked={tmpUsers.includes(user)}
                onChange={() => handleToggleUser(user)}
              />
              {user}
            </label>
          ))}
        </div>

        <hr />

        <div className="filter-options">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={tmpHide}
              onChange={(e) => setTmpHide(e.target.checked)}
            />
            指定日が未回答(-)のユーザーがいれば除外
          </label>

          <div className="radio-group-vertical">
            <label>
              <input
                type="radio"
                name="matchTypes"
                value="anyone_x"
                checked={tmpMatch === "anyone_x"}
                onChange={(e) => setTmpMatch(e.target.value)}
              />
              一人でも「✕」がいれば除外
            </label>
            <label>
              <input
                type="radio"
                name="matchTypes"
                value="all_x"
                checked={tmpMatch === "all_x"}
                onChange={(e) => setTmpMatch(e.target.value)}
              />
              全員が「✕」の場合のみ除外
            </label>
          </div>
        </div>

        <div className="modal-buttons">
          <button onClick={onClose} className="btn-cancel">
            キャンセル
          </button>
          <button
            onClick={() =>
              onApply({
                type: "user",
                selectedUsers: tmpUsers,
                hideUnanswered: tmpHide,
                matchTypes: tmpMatch,
              })
            }
            className="btn-apply"
            disabled={tmpUsers.length === 0}
          >
            適用する
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Discordからのリダイレクトを受け取るコンポーネント ---
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      // 自前サーバーのAPIを叩く
      fetch(
        "https://puny-stormie-mametin-61164a7d.koyeb.app/api/auth/discord",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        },
      )
        .then((res) => res.json())
        .then((userData) => {
          console.log("Raw Discord Data:", userData);

          if (userData && (userData.id || userData.username)) {
            const raw = userData;

            const userInfo = {
              id: raw.id,
              username:
                raw.global_name ||
                raw.display_name ||
                raw.username ||
                "Unknown",
              avatar:
                raw.avatar && raw.avatar.startsWith("http")
                  ? raw.avatar
                  : raw.avatar
                    ? `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png`
                    : `https://cdn.discordapp.com/embed/avatars/${(BigInt(raw.id || 0) >> 22n) % 6n}.png`,
            };

            localStorage.removeItem("discord_user");
            localStorage.setItem("discord_user", JSON.stringify(userInfo));

            console.log("Final Saved Info:", userInfo);
            navigate("/");
          }
        })
        .catch((err) => {
          console.error(err);
          navigate("/");
        });
    }
  }, [navigate]);

  return (
    <div className="auth-loading-container">
      <div className="loader"></div>
      <h2>認証中</h2>
      <p>少々お待ちください...</p>
    </div>
  );
}

// --- メインのAppコンポーネント ---
function App() {
  const [allData, setAllData] = useState({ last: [], current: [], next: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://puny-stormie-mametin-61164a7d.koyeb.app/api/data")
      .then((res) => res.json())
      .then((data) => {
        setAllData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("データ取得失敗:", err);
        setLoading(false);
      });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<CalendarView allData={allData} />} />
      <Route path="/new" element={<EntryForm allData={allData} />} />
      <Route path="/callback" element={<AuthCallback />} />
      <Route
        path="/edit/:targetName"
        element={<EntryForm allData={allData} />}
      />
    </Routes>
  );
}

export default App;
