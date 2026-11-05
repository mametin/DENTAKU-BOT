import { Link } from "react-router-dom";
import headerIcon from "../IMG_icon.jpg";

// 各ページで使用する共通の表示コンポーネント。
export function SiteTitle() {
  return (
    <h1 className="header-title">
      <Link to="/" className="header-home-link" aria-label="日程調整くんWEB：カレンダーへ戻る">
        <img src={headerIcon} alt="" className="title-icon" />
        日程調整くんWEB
      </Link>
    </h1>
  );
}
