const { Client, ClientApplication } = require("discord.js");
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

const hello = {
  name: "hello",
  description: "botがあなたに挨拶します。",
  options: [
    {
      type: "STRING",
      name: "language",
      description: "どの言語で挨拶するか指定します。",
      required: true,
      choices: [
        {
          name: "English",
          value: "en",
        },
        {
          name: "Japanese",
          value: "ja",
        },
      ],
    },
  ],
};

const add = {
   name: "add",
  required: true,
   description: "日程の入力が行えます。",
};

const show = {
  name: "show",
  required: true,
  description: "日程の閲覧が行えます。",
  options: [
    {
      type: "STRING",
      name: "type",
      description: "表示形式の選択",
      required: true,
      choices: [
        {
          name: "Spreadsheet",
          value: "sp",
        },
        {
          name: "Calendar",
          value: "ca",
        },
      ],
    },
  ],
};

const deletes = {
  name: "deletes",
  required: true,
  description: "日程の削除が行えます。",
};

const corrects = {
  name: "corrects",
  required: true,
  description: "日程の修正が行えます。",
};

const searchs = {
  name: "searchs",
  required: true,
  description: "日程の検索が行えます。",
};

const omikuji = {
   name: "omikuji",
  required: true,
   description: "本日の運勢が占えます",
};

const commands = [hello,add,show,deletes,corrects,searchs,omikuji];
const client = new Client({
  intents: 0,
});
client.token = process.env.DISCORD_BOT_TOKEN;
async function main() {
  client.application = new ClientApplication(client, {});
  await client.application.fetch();
  await register(client, commands, process.argv[2]);
  console.log("registration succeed!");
}
main().catch((err) => console.error(err));
