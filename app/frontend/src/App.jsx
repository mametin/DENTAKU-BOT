import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import CalendarView from "./components/CalendarView";
import EntryForm from "./components/EntryForm";
import AuthCallback from "./components/AuthCallback";
import HelpPage from "./components/HelpPage";

import './styles/App.css';

// --- メインのAppコンポーネント ---
function App() {
  const [allData, setAllData] = useState({ last: [], current: [], next: [], next2: [] });
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

  const loadingScreen = (
      <div className="full-screen-loading" role="status" aria-label="データを読み込み中">
        <div className="loader"></div>
      </div>
  );

  return (
    <Routes>
      <Route path="/" element={loading ? loadingScreen : <CalendarView allData={allData} />} />
      <Route path="/new" element={loading ? loadingScreen : <EntryForm allData={allData} />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/callback" element={<AuthCallback />} />
      <Route
        path="/edit/:targetName"
        element={loading ? loadingScreen : <EntryForm allData={allData} />}
      />
    </Routes>
  );
}

export default App;
