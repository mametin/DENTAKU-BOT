function handleDiscordAuth(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const code = params.code;

    const props = PropertiesService.getScriptProperties();
    const CLIENT_ID = props.getProperty('DISCORD_CLIENT_ID');
    const CLIENT_SECRET = props.getProperty('DISCORD_CLIENT_SECRET');

    // ※重要：ここのREDIRECT_URIは、Discord Portalに登録した「ReactのURL」にします
    const REDIRECT_URI = 'https://dentaku-bot.vercel.app/callback';

    // 1. トークン交換
    const tokenResponse = UrlFetchApp.fetch('https://discord.com/api/oauth2/token', {
      method: 'post',
      payload: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }
    });
    const tokenData = JSON.parse(tokenResponse.getContentText());

    // 2. ユーザー情報取得
    const userResponse = UrlFetchApp.fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token }
    });
    const userData = JSON.parse(userResponse.getContentText());

    let avatarUrl = "";
    if (userData.avatar) {
      avatarUrl = "https://cdn.discordapp.com/avatars/" + userData.id + "/" + userData.avatar + ".png";
    } else {
      var defaultIndex = (parseInt(userData.id.slice(-5)) % 5);
      avatarUrl = "https://discord.com/embed/avatars/" + defaultIndex + ".png";
    }

    const result = {
      id: userData.id,
      username: userData.global_name || userData.display_name || userData.username,
      avatar: avatarUrl
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}