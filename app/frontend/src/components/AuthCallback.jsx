// --- Discordからのリダイレクトを受け取るコンポーネント ---
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

export default AuthCallback;
