export const GAS_URL = "https://script.google.com/macros/s/AKfycbytDVAVE1488ftKB3LCPNXILV3yLjuVT01IINEb6eaLv0RCvDZ_VdypRjV03esCZtQ4/exec";
export const DISCORD_URL = "https://discord.com/oauth2/authorize?client_id=1263473828319989772&response_type=code&redirect_uri=https%3A%2F%2Fdentaku-bot.vercel.app%2Fcallback&scope=identify";

export const loginWithDiscord = () => {
  window.location.href = DISCORD_URL;
};