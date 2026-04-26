import React, { useState, useEffect } from "react";

function DayFilterModal({ isOpen, onClose, onApply, currentConfig }) {
    const daysOfWeek = ["月", "火", "水", "木", "金", "土", "日"];
    const [tmpDays, setTmpDays] = useState(currentConfig.selectedDays || []);

    useEffect(() => {
        if (isOpen) {
            setTmpDays(currentConfig.selectedDays || []);
        }
    }, [isOpen, currentConfig]);

    if (!isOpen) return null;

    const handleToggleDay = (day) => {
        setTmpDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

return (
    <div className="modal-overlay">
      <div className="modal-content filter-modal">
        <h3>表示する曜日を選択</h3>
        <div className="user-checkbox-list">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="check-vertical" style={{ margin: 0 }}>
              <input
                type="checkbox"
                id={`day_checkbox_${index}`}
                checked={tmpDays.includes(day)}
                onChange={() => handleToggleDay(day)}
              />
              <label htmlFor={`day_checkbox_${index}`}>{day}曜日</label>
            </div>
          ))}
        </div>
        <div className="modal-buttons">
          <button onClick={onClose} className="btn-cancel">
            キャンセル
          </button>
          <button
            onClick={() => onApply({ selectedDays: tmpDays })}
            className="btn-apply"
            disabled={tmpDays.length === 0}
          >
            適用する
          </button>
        </div>
      </div>
    </div>
  );
}

export default DayFilterModal;