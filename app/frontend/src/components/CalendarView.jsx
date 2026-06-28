// --- カレンダー表示コンポーネント ---
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserFilterModal from "./UserFilterModal";
import DayFilterModal from "./DayFilterModal";
import headerIcon from "../IMG_icon.jpg";
import { loginWithDiscord } from "../constants";

import '../styles/CalendarView.css';
// ...

function CalendarView({ allData }) {
  const navigate = useNavigate();

  //ハンバーガーメニュー開閉ステート
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    selectedUsers: [], // 絞り込むユーザーのリスト
    selectedDays: [], // 絞り込む曜日のリスト
    hideUnanswered: true, // 未回答を非表示にするか
    matchTypes: "anyone_x", // "all_ok","anyone_x"
  });

  // フィルタの選択状態管理
  const [filterSelectValue, setFilterSelectValue] = useState("");

  // 集計行の表示フラグ
  const [showSummary, setShowSummary] = useState(true);

  // フィルタ用モーダルの状態管理
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDayFilterModalOpen, setIsDayFilterModalOpen] = useState(false);

  // フィルタ解除関数
  const resetFilter = () => {
    setFilterConfig({
      type: null,
      selectedUsers: [],
      selectedDays: [],
      hideUnanswered: true,
      matchTypes: "anyone_x",
    });
    setFilterSelectValue("");
  };

  // フィルタ選択モーダルを開くハンドラ
  const handlefilterChange = (e) => {
    const selectedValue = e.target.value;
    setFilterSelectValue(selectedValue);

    if (selectedValue === "user") {
      setIsFilterModalOpen(true);
    }
    if (selectedValue === "day") {
      setIsDayFilterModalOpen(true);
    }
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
  const allkeysSet = new Set();
  items.forEach((item) => {
    if (item.details) {
      Object.keys(item.details).forEach((key) => allkeysSet.add(key));
    }
  });

  const excludedMarks = ["◎", "△", "▽", "✕", "☐", ""];
  const allUserNames = Array.from(allkeysSet).filter(
    (key) => !excludedMarks.includes(key),
  );

  const targetMonthForInput = activeMonth === "last" ? "current" : activeMonth;
  const targetItemsForInput = allData[targetMonthForInput] || [];

  // ボタンの状態判定は「表示中のタブ」ではなく「遷移先の月」のデータで行う
  const targetUserIdRow = targetItemsForInput.find(
    (item) => item.date === "ユーザID",
  );

  let targetMyRegisteredName = null;
  if (user && targetUserIdRow && targetUserIdRow.details) {
    for (const [name, id] of Object.entries(targetUserIdRow.details)) {
      if (id === user.id) {
        targetMyRegisteredName = name;
        break;
      }
    }
  }
  const isAlreadyAnswered = !!targetMyRegisteredName;

  // 表示する列（カラム）を決定
  const displayColumns =
    filterConfig.selectedUsers.length > 0
      ? filterConfig.selectedUsers
      : allUserNames;

  // 表示する行（日付）をフィルタリング
  const boundaryIndex = items.findIndex(
    (item) => !item.date || item.date.trim() === "" || item.date === "日付不明",
  );
  const calendarItems =
    boundaryIndex === -1 ? items : items.slice(0, boundaryIndex);

  const displayRow = calendarItems.filter((item) => {
    if (item.date === "コメント" || item.date === "ユーザID") return false;

    // 曜日フィルタの処理
    if (filterConfig.selectedDays.length > 0) {
      const match = item.date.match(/\((.)\)/);
      const day = match ? match[1] : null;

      if (!filterConfig.selectedDays.includes(day)) {
        return false;
      }
    }

    // ユーザーフィルタの判定
    if (filterConfig.selectedUsers.length > 0) {
      const targetStatuses = filterConfig.selectedUsers.map(
        (u) => item.details?.[u],
      );
      
      // 指定日が未回答(-)のユーザーがいれば除外
      if (filterConfig.hideUnanswered && targetStatuses.some((s) => s === "-"))
        return false;

      // ✕ に関する判定
      if (
        filterConfig.matchTypes === "anyone_x" &&
        targetStatuses.includes("✕")
      )
        return false;

      if (
        filterConfig.matchTypes === "all_x" &&
        targetStatuses.every((s) => s === "✕")
      )
        return false;
    }
    return true;
  });

  const summaryData = displayRow.map((item) => {
    const summary = { "◎": 0, "△": 0, "▽": 0, "✕": 0, "☐": 0 };
    displayColumns.forEach((user) => {
      const val = item.details?.[user];
      if (val === "◎") summary["◎"]++;
      if (val === "△") summary["△"]++;
      if (val === "▽") summary["▽"]++;
      if (val === "✕") summary["✕"]++;
      if (/\d+-\d+/.test(val)) summary["☐"]++;
    });
    return summary;
  });

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

        <button
          className={`hamburger-btn ${isMenuOpen ? "open" : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* --- ハンバーガーメニュー --- */}
        <div className={`header-right ${isMenuOpen ? "menu-open" : ""}`}>
          <div className="mobile-menu-header">
            {user ? (
              <div className="mobile-user-info">
                <img src={user.avatar} alt="avatar" className="mobile-avatar" />
                <span className="mobile-username">{user.username}</span>
              </div>
            ) : (
              <div className="mobile-user-info">
                <span className="mobile-guest-text">ゲスト閲覧中</span>
              </div>
            )}
          </div>

          <nav className="header-menu">
            <ul>
              {/* 入力ボタン */}
              {isAlreadyAnswered ? (
                <li>
                  <Link
                    to={`/edit/${encodeURIComponent(targetMyRegisteredName)}?month=${targetMonthForInput}`}
                    className="btn-new"
                  >
                    入力の編集
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    to={`/new?month=${targetMonthForInput}`}
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

          <div className="mobile-filter-area">
            <p className="mobile-filter-label">表示設定・絞り込み</p>

            <div className="mobile-summary-toggle">
              <span>集計行の表示</span>
              <label className="toggle-summary-enabled">
                <input
                  type="checkbox"
                  checked={showSummary}
                  onChange={(e) => setShowSummary(e.target.checked)}
                />
              </label>
            </div>

            <div className="filter-controls">
              <label className="box-filter">
                <select
                  className="selectbox-filter"
                  value={filterSelectValue}
                  onChange={handlefilterChange}
                >
                  <option value="">-</option>
                  <option value="user">ユーザーで絞り込む</option>
                  <option value="day">曜日で絞り込む</option>
                  <option value="date">日付で絞り込む</option>
                </select>
              </label>
              {(filterConfig.selectedUsers.length > 0 ||
                filterConfig.selectedDays.length > 0) && (
                <button className="btn-resetFilter" onClick={resetFilter}>
                  フィルタ解除
                </button>
              )}
            </div>
          </div>

          {/* --- ログインバナー --- */}
          {user ? (
            <div className="user-banner pc-only">
              <img src={user.avatar} alt="avatar" className="avatar-img" />
              <span className="username-text">{user.username}</span>
              <button onClick={handleLogout} className="btn-logout">
                ログアウト
              </button>
            </div>
          ) : (
            <div className="user-banner pc-only">
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
                }}
              >
                ログイン
              </button>
            </div>
          )}
        </div>
      </header>

      {/* --- ユーザフィルタモーダル --- */}
      <div className="container">
        <UserFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => {
            setIsFilterModalOpen(false);
            setFilterSelectValue("");
          }}
          userList={allUserNames}
          currentConfig={filterConfig}
          onApply={(config) => {
            setFilterConfig((prev) => ({
              ...prev,
              selectedUsers: config.selectedUsers,
              hideUnanswered: config.hideUnanswered,
              matchTypes: config.matchTypes,
            }));
            setIsFilterModalOpen(false);
            setFilterSelectValue("");
          }}
        />

        {/* --- 曜日フィルタモーダル --- */}
        <DayFilterModal
          isOpen={isDayFilterModalOpen}
          onClose={() => {
            setIsDayFilterModalOpen(false);
            setFilterSelectValue("");
          }}
          currentConfig={filterConfig}
          onApply={(config) => {
            setFilterConfig((prev) => ({
              ...prev,
              selectedDays: config.selectedDays,
            }));
            setIsDayFilterModalOpen(false);
            setFilterSelectValue("");
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

              {/* --- 集計行を表示するか --- */}
              <div className="filter-controls">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#333",
                    }}
                  >
                    集計行( ◎△▽✕☐ )の表示：
                  </span>
                  <label className="toggle-summary-enabled">
                    <input
                      type="checkbox"
                      checked={showSummary}
                      onChange={(e) => setShowSummary(e.target.checked)}
                    />
                  </label>
                </div>

                {/* --- フィルタ選択 --- */}
                <label className="box-filter">
                  <select
                    className="selectbox-filter"
                    value={filterSelectValue}
                    onChange={handlefilterChange}
                  >
                    <option value="">-</option>
                    <option value="user">ユーザーで絞り込む</option>
                    <option value="day">曜日で絞り込む</option>
                    <option value="date">日付で絞り込む</option>
                  </select>
                </label>
                {(filterConfig.selectedUsers.length > 0 ||
                  filterConfig.selectedDays.length > 0) && (
                  <button className="btn-resetFilter" onClick={resetFilter}>
                    ✕
                  </button>
                )}
              </div>

              {filterConfig.selectedUsers.length > 0 && (
                <div className="filter-status-badge">
                  絞り込み中: {filterConfig.selectedUsers.join(", ")}
                </div>
              )}

              {filterConfig.selectedDays.length > 0 && (
                <div className="filter-status-badge">
                  絞り込み中: {filterConfig.selectedDays.join(", ")}曜日
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  {showSummary && (
                    <>
                      <th className="stat-header">◎</th>
                      <th className="stat-header">△</th>
                      <th className="stat-header">▽</th>
                      <th className="stat-header">✕</th>
                      <th className="stat-header">☐</th>
                    </>
                  )}

                  {displayColumns.map((user) => (
                    <th key={user}>
                      {activeMonth === "last" ? (
                        <span style={{ color: "#666" }}>{user}</span>
                      ) : (
                        <Link
                          to={`/edit/${encodeURIComponent(user)}?month=${activeMonth}`}
                          className="user-edit-link"
                        >
                          {user}
                        </Link>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRow.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.date}</td>

                    {showSummary && (
                      <>
                        <td>{item.details?.["◎"] || 0}</td>
                        <td>{item.details?.["△"] || 0}</td>
                        <td>{item.details?.["▽"] || 0}</td>
                        <td>{item.details?.["✕"] || 0}</td>
                        <td>{item.details?.["☐"] || 0}</td>
                      </>
                    )}

                    {displayColumns.map((u) => {
                      const val = item.details?.[u] || "-";
                      const isTimeValue = /\d+-\d+/.test(val);

                      return (
                        <td key={u}>
                          {isTimeValue ? (
                            <div className="tooltip-container">
                              <div className="tooltip-trigger symbol-box mark-☐">☐</div>
                              <span className="tooltip-content">{val}</span>
                            </div>
                          ) : val !== "-" ? (
                            <div className={`symbol-box mark-${val}`}>
                              {val}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default CalendarView;
