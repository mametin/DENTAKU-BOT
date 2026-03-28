import React, { useEffect, useState } from "react"; 
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";

// --- カレンダー表示コンポーネント ---
function CalendarView({ items }) {
  if (!items || items.length === 0) {
    return <div className="container">データを読み込み中...</div>;
  }

  // 1. ユーザー名のリストを取得
  const users = items[0].users || [];

  return (
    <div className="container">
      <h1>日程調整カレンダー</h1>
      
      <div className="action-bar">
        <Link to="/new" className="btn-new">日程を新規に入力する</Link>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>日付</th>
              {/* ユーザー名を横に並べる*/}
              {users.map((user) => (
                <th key={user}>{user}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                {/* 日付列  */}
                <td>{item.date}</td>
                

                {/* 各ユーザーの記号*/}
                {users.map((user) => {
                  const mark = item.details[user];
                  return (
                    <td key={user} className={`mark-${mark}`}>
                      {mark || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// --- 入力フォームコンポーネント---
function EntryForm({ items }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [responses, setResponses] = useState({});
  const [otherTexts, setOtherTexts] = useState({}); 

  if (!items || items.length === 0) {
    return <div className="container">データを読み込み中...</div>;
  }

  // index.ejs の構造に合わせて日付リストを取得
  const dates = items.map(item => item.date);

  const handleRadioChange = (date, value) => {
    setResponses({ ...responses, [date]: value });
  };

  const handleOtherTextChange = (date, text) => {
    setOtherTexts({ ...otherTexts, [date]: text });    // 記述内容を保存
    setResponses({ ...responses, [date]: "その他" });    // 「他」のテキストを入力したら、自動的にその日の選択を「その他」に設定
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 送信用にデータを整形
    const finalResponses = { ...responses };
    dates.forEach(date => {
      if (finalResponses[date] === "その他") {
        finalResponses[date] = otherTexts[date] || "未入力";
      }
    });

    const payload = { name, comment, responses: finalResponses };

    try {
      const res = await fetch("http://localhost:3000/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        alert("送信完了しました！");
        navigate("/");
        window.location.reload(); 
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    }
  };

  return (
    <div className="container">
      <h1>日程の新規入力</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <span class="textbox-name-label">名前：</span>
              <input 
                class="textbox-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
             />
          </label>
        </div>

        <hr />

        <div className="date-list">
          <h3>日程選択</h3>
          {dates.map((date) => (
            <div className="date-item" key={date}>
              <span className="date-label">{date}</span>
              <div className="options">
                {/* 記号ごとの選択肢*/}
                {[
                  { val: "◎", label: "ok", mark: "mark-◎" },
                  { val: "△", label: "tri", mark: "mark-△" },
                  { val: "▽", label: "rev", mark: "mark-▽" },
                  { val: "×", label: "ng", mark: "mark-×" }
                ].map((opt) => (
                  <React.Fragment key={opt.val}>
                    <input
                      type="radio"
                      id={`${opt.label}_${date}`}
                      name={`date_${date}`}
                      value={opt.val}
                      checked={responses[date] === opt.val}
                      onChange={() => handleRadioChange(date, opt.val)}
                      required
                    />
                    <label htmlFor={`${opt.label}_${date}`} className="option-label">
                      <span className={opt.mark}>{opt.val}</span>
                    </label>
                  </React.Fragment>
                ))}

                {/* 「他」記述フィールド */}
                <div className="other-wrapper">
                  <input
                    type="radio"
                    id={`other_radio_${date}`}
                    name={`date_${date}`}
                    value="その他"
                    checked={responses[date] === "その他"}
                    onChange={() => handleRadioChange(date, "その他")}
                  />
                  <label htmlFor={`other_radio_${date}`} className="option-label" style={{ border: 'none', padding: '0 5px' }}>他</label>
                  <input
                    type="text"
                    className="other-input"
                    placeholder="記述..."
                    value={otherTexts[date] || ""}
                    onChange={(e) => handleOtherTextChange(date, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>
            <span class="textbox-name-label">コメント：</span>
              <input 
                class="textbox-coment"
                type="text" 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}  
              />
          </label>
        </div>

        <div className="submit-box" style={{ marginTop: '50px' }}>
          <button type="submit" className="btn-submit">送信</button>

          <button type="cancel" className="btn-cancel" onClick={() => navigate("/")}>キャンセル</button>
        </div>
      </form>
    </div>
  );
}

// --- メインのAppコンポーネント ---
function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/data")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("データ取得失敗:", err));
  }, []);

  return (
    <Routes>
      <Route path="/" element={<CalendarView items={items} />} />
      <Route path="/new" element={<EntryForm items={items} />} />
    </Routes>
  );
}

export default App;