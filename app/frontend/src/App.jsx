import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // サーバー(Node.js)のAPIからデータを取得
    fetch('http://localhost:3000/api/data') 
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("データ取得失敗:", err));
  }, []);

  return (
    <div className="container">
      <h1>日程調整カレンダー (React版)</h1>
      
      <div className="action-bar">
        <button className="btn-new" onClick={() => alert("入力フォームは作成中")}>
          日程を新規に入力する
        </button>
      </div>

      {items.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>空き</th>
                {items[0].users.map(user => <th key={user}>{user}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.date}</td>
                  <td className={item.count > 0 ? 'count-ok' : 'count-zero'}>
                    {item.count}人
                  </td>
                  {item.users.map(user => (
                    <td key={user} className={`mark-${item.details[user]}`}>
                      {item.details[user]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>データを読み込み中...</p>
      )}
    </div>
  )
}

export default App