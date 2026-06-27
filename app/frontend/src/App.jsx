import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import CalendarView from "./components/CalendarView";
import EntryForm from "./components/EntryForm";
import AuthCallback from "./components/AuthCallback";

import './styles/global.css';

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

  if (loading) {
    return (
      <div className="full-screen-loading">
        <div className="loader"></div>
      </div>
    );
  }

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
