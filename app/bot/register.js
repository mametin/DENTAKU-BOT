const { 
  Client, 
  GatewayIntentBits, 
  ApplicationCommandOptionType, 
  PermissionFlagsBits 
} = require("discord.js");
/**
 *
 * @param {Client} client
 * @param {import("discord.js").ApplicationCommandData[]} commands
 * @param {import("discord.js").Snowflake} guildID
 * @returns {Promise<import("@discordjs/collection").Collection<string,import("discord.js").ApplicationCommand>>}
 */
async function register(client, commands, guildID) {
  if (guildID == null) {
    return client.application.commands.set(commands);
  }
  return client.application.commands.set(commands, guildID);
}

//===========================================
// コマンドオプション設定
//===========================================

//--- ロール選択コマンド ---
const role_options = [
  {
    name: 'target_channel',
    description: 'パネルを設置するチャンネルを選択してください',
    type: ApplicationCommandOptionType.Channel,
    required: true
  },
  {
    name: 'explan_roll',
    description: 'ロールの説明文を入力してください',
    type: ApplicationCommandOptionType.String,
    required: true
  }
];

const MAX_ROLES = 20;

for (let i = 1; i <= MAX_ROLES; i++) {
  role_options.push({
    name: `role${i}`,
    description: `選択肢に入れるロール (${i})`,
    type: ApplicationCommandOptionType.Role,
    required: i === 1
  });
}

//===========================================
// コマンドオプション設定 終了
//===========================================

const hello = {
  name: "hello",
  description: "botがあなたに挨拶します。",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "language",
      description: "どの言語で挨拶するか指定します。",
      required: true,
      choices: [
        { name: "English", value: "en", },
        { name: "Japanese", value: "ja", },
      ],
    },
  ],
};

const add = {
  name: "add",
  description: "日程の入力が行えます。",
};

const show = {
  name: "show",
  description: "日程の閲覧が行えます。",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "type",
      description: "表示形式の選択",
      required: true,
      choices: [
        { name: "Spreadsheet", value: "sp", },
        { name: "Calendar", value: "ca", },
      ],
    },
  ],
};

const deletes = {
  name: "delete",
  description: "日程の削除が行えます。",
};

const corrects = {
  name: "correct",
  description: "日程の修正が行えます。",
};

const searchs = {
  name: "search",
  description: "セッション予定の検索が行えます。",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "type",
      description: "検索方法の選択",
      required: true,
      choices: [
        { name: "タイトル検索", value: "title", },
        { name: "日付検索", value: "date", },
        { name: "KP名検索", value: "kp", },
        { name: "PL検索", value: "pl", },
      ],
    },
  ],
};

const omikuji = {
  name: "omikuji",
  description: "本日の運勢が占えます",
};

const roles = {
  name: 'setup_roles',
  description: 'ロール選択パネルを設置します（最大20個まで指定可能）',
  options: role_options,
  defaultMemberPermissions: PermissionFlagsBits.Administrator
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
};

const notice = {
  name: 'notice',
  description: '日程調整くんに話させるコマンド(コマンド制作者のみ使用可能)',
  defaultMemberPermissions: PermissionFlagsBits.Administrator
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
};


const commands = [hello, add, show, deletes, corrects, searchs, omikuji, roles, notice];

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.token = process.env.DISCORD_BOT_TOKEN;
async function main() {
  await client.login();
  await register(client, commands, process.argv[2]);
  console.log("registration succeed!");
  process.exit();
}
main().catch((err) => console.error(err));