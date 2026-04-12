import React, { useState } from "react";

const TimeSlotModal = ({ date, initialValue, onSave, onClose }) => {
  // 初期値（"10:00-11:00,13:00-14:00" 形式）をオブジェクトの配列に変換
  const [slots, setSlots] = useState(() => {
    if (!initialValue || initialValue === "その他" || initialValue === "-") return [];
    return initialValue.split(',').map(s => {
      const [start, end] = s.split('-');
      return { start, end };
    });
  });

  const [newStart, setNewStart] = useState("10:00");
  const [newEnd, setNewEnd] = useState("11:00");
  const [error, setError] = useState("");

  const addSlot = () => {
    setError("");

    // 入力チェック
    if (!newStart || !newEnd) {
      setError("時刻を両方入力してください。");
      return;
    }

    // 時間の逆転・同時チェック (例: 13:00 ～ 12:00 はNG)
    if (newStart >= newEnd) {
      setError("終了時刻は開始時刻より後の時間にしてください。");
      return;
    }

    // 全く同じ時間帯の重複チェック
    const isDuplicate = slots.some(
      (s) => s.start === newStart && s.end === newEnd
    );
    if (isDuplicate) {
      setError("その時間帯は既に追加されています。");
      return;
    }

    // 既存の時間帯との重なりチェック
    const isOverlapping = slots.some((s) => {
      return (newStart < s.end && newEnd > s.start);
    });
    if (isOverlapping) {
      setError("既存の時間帯と重なっています。");
      return;
    }

    setSlots([...slots, { start: newStart, end: newEnd }]);
  };

  const handleConfirm = () => {
    if (slots.length === 0) {
      onClose(); // 何もなければキャンセルと同じ扱い
      return;
    }
    // 配列を "10:00-11:00,13:00-14:00" の文字列に戻して保存
    const formatted = slots
      .sort((a, b) => a.start.localeCompare(b.start)) // 開始時間順に並び替え
      .map(s => `${s.start}-${s.end}`)
      .join(',');
    onSave(date, formatted);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ marginTop: 0 }}>{date} の時間指定</h3>
        
        {/* 追加済みのリスト */}
        <div className="slot-tags">
          {slots.length === 0 && <p style={{ fontSize: '0.85em', color: '#888' }}>時間帯を追加してください</p>}
          {slots.map((slot, i) => (
            <div key={i} className="tag">
              {slot.start} 〜 {slot.end}
              <button onClick={() => setSlots(slots.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '15px 0' }} />

        {/* 入力フォーム */}
        <div className="modal-input-row">
          <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} />
          <span>〜</span>
          <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
          <button className="btn-add-slot" onClick={addSlot}>追加</button>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div style={{ color: "#c62828", fontSize: "0.75rem", marginBottom: "10px", fontWeight: "bold" }}>
             {error}
          </div>
        )}

        {/* 足元のボタン */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
          <button onClick={onClose} className="btn-modal-cancel" style={{ background: '#eee', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
            キャンセル
          </button>
          <button onClick={handleConfirm} className="btn-modal-save" style={{ background: '#333', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' }}>
            確定
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotModal;