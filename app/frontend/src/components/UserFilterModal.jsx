import React, { useState } from "react";
import { useEffect } from "react";
import { use } from "react";

import '../styles/Modal.css';

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

  useEffect(() => {
    if (isOpen) {
      setTmpUsers(currentConfig.selectedUsers);
      setTmpHide(currentConfig.hideUnanswered);
      setTmpMatch(currentConfig.matchTypes);
    }
  }, [isOpen, currentConfig]);

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
          {userList.map((user, index) => (
            <div key={user} className="check-vertical" style={{ margin: 0 }}>
              <input
                type="checkbox"
                id={`user_checkbox_${index}`}
                checked={tmpUsers.includes(user)}
                onChange={() => handleToggleUser(user)}
              />
              <label htmlFor={`user_checkbox_${index}`}>{user}</label>
            </div>
          ))}
        </div>

        <hr />

        <div className="filter-options">
          <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#333" }}>
            詳細設定
          </h4>

          <div className="check-vertical" style={{ margin: "0 0 10px 0" }}>
            <input
              type="checkbox"
              id="hide_unanswered"
              checked={tmpHide}
              onChange={(e) => setTmpHide(e.target.checked)}
            />
            <label htmlFor="hide_unanswered">
              指定日が未回答(-)のユーザーがいる日程を除外
            </label>
          </div>

          <div
            className="radio-group-vertical"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={{ position: "relative" }}>
              <input
                type="radio"
                id="match_anyone"
                name="matchTypes"
                value="anyone_x"
                checked={tmpMatch === "anyone_x"}
                onChange={(e) => setTmpMatch(e.target.value)}
              />
              <label htmlFor="match_anyone">
                一人でも「✕」がいる日程を除外
              </label>{" "}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="radio"
                id="match_all"
                name="matchTypes"
                value="all_x"
                checked={tmpMatch === "all_x"}
                onChange={(e) => setTmpMatch(e.target.value)}
              />
              <label htmlFor="match_all">全員が「✕」の日程を除外</label>{" "}
            </div>
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

export default UserFilterModal;
