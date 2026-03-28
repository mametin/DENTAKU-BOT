const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder 
} = require("discord.js");
const { DynamicLoader } = require("bcdice");
const { UserDefinedDiceTable } = require("bcdice");
const wait = require("util");

const options = { 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.MessageContent
  ] 
};
const client = new Client(options);

client.on("ready", (message) => {
  console.log("Bot準備完了！");
});

//====================================================
// 変数宣言
//====================================================

var inputData; //送信データ

var storedata; //再入力時私用データ

var postData;
var responseData;

//閲覧リンク
const sp_url =
  "https://docs.google.com/spreadsheets/d/1kSk4Zhpc9mNeUMigqUWp_8n_juSZHzNymgkX6AEI688/edit?gid=0#gid=0";
const ca_url =
  "https://calendar.google.com/calendar/embed?src=mamebot0705%40gmail.com&ctz=Asia%2FTokyo";

//送信に用いる
const axiosBase = require("axios");
const url =
  "/macros/s/AKfycbzVoslQaiYHmqKCNlEcQLnwQw8VuEpQDA5aPgIH1YiKADWbezW3X2LcWgVRvU6maY2akQ/exec"; // gasのドメイン以降のurl
const data = { key: "value" }; // 送信するデータ

const axios = axiosBase.create({
  baseURL: "https://script.google.com",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  responseType: "json",
});

//====================================================
// コマンド処理内容の記述
//====================================================
const commands = {
  //挨拶
  async hello(interaction) {
    const source = {
      en(name) {
        return `Hello, ${name}!`;
      },
      ja(name) {
        return `やあ、${name}さん。`;
      },
    };
    const name = interaction.member?.displayName ?? interaction.user.username;
    // v14修正: get().value ではなく getString() を使用
    const lang = interaction.options.getString("language");
    return interaction.reply(source[lang](name));
  },

  //---------------------------------------------------
  // 日程入力
  //---------------------------------------------------
  async add(interaction) {
    const modal = createModal_add("input", "予定の入力");
    await interaction.showModal(modal);
  },

  //---------------------------------------------------
  // 日程閲覧
  //---------------------------------------------------
  async show(interaction) {
    const source = {
      sp() {
        return `[スプレッドシートリンク](<${sp_url}>)`;
      },
      ca() {
        return `[カレンダーリンク](<${ca_url}>)`;
      },
    };
    // v14修正: getString() を使用
    const type = interaction.options.getString("type");
    return await interaction.reply({
      content: source[type](),
      ephemeral: true,
    });
  },

  //---------------------------------------------------
  // 日程削除
  //---------------------------------------------------
  async delete(interaction) {
    const modal = new ModalBuilder().setCustomId("deletes").setTitle("予定の削除");

    const DeleteID = new TextInputBuilder()
      .setCustomId("Delete")
      .setLabel("削除したいスケジュールのIDを入力")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(DeleteID));

    await interaction.showModal(modal);
  },

  //----------------------------------------------------
  // 日程修正
  //----------------------------------------------------
  async correct(interaction) {
    const modal = createModal_correct("corrects", "予定の修正");
    await interaction.showModal(modal);
  },

  //--------------------------------------------------- 
  // 日程検索
  //---------------------------------------------------
  async search(interaction) {
    const source = {
      date: {
        title: "日付から検索",
        label: "検索したい予定の日付を入力(yyyy/mm/dd)",
        placeholder: "ex)2025/07/05"
      },
      title: {
        title: "タイトルから検索",
        label: "検索したい予定のタイトルを入力",
        placeholder: "シナリオ名を入力"
      },
      kp: {
        title: "KP名から検索",
        label: "検索したいKPの名前を入力",
        placeholder: "KP名を入力"
      },
      pl: {
        title: "PL名から検索",
        label: "検索したいPLの名前を入力",
        placeholder: "PL名を入力"
      }
    };

    const type = interaction.options.getString("type");
    const config = source[type];

    if (!config) {
      return interaction.reply({
        content: "検索タイプを指定してください。",
        ephemeral: true,
      });
    }

    // モーダルの作成
    const modal = new ModalBuilder()
      .setCustomId(`search_${type}`)
      .setTitle(config.title);

    const input = new TextInputBuilder()
      .setCustomId("Search")
      .setLabel(config.label)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(config.placeholder || '')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  },

  //---------------------------------------------------
  // おみくじ
  //----------------------------------------------------
  async omikuji(interaction) {
    const rollResult = await diceroll(
      "DiceBot",
      "choice[大吉,吉,中吉,小吉,末吉,凶]"
    );
    return interaction.reply(rollResult.text.slice(27));
  },

  //---------------------------------------------------
  // ロール選択パネル生成
  //---------------------------------------------------
  async setup_roles(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content: "このコマンドを使用する権限がありません。",
        ephemeral: true,
      });
    }

    const targetChannel = interaction.options.getChannel('target_channel');
    const label1 = interaction.options.getString('explan_roll');
    const menuRoles = [];
    let roleListText = "";

    // --- パネルに配置するロールの一覧を取得 ---
    for (let i = 1; i <= 20; i++) {
      const role = interaction.options.getRole(`role${i}`);

      if (role) {
        const isDuplicate = menuRoles.some(r => r.value === role.id);
        if (!isDuplicate) {
          menuRoles.push({
            label: role.name,
            value: role.id,
            description: 'クリックして着脱'
          });

          roleListText += `・${role}\n`;
        }
      }
    }

    //--- メニュー ---
    const embed = new EmbedBuilder()
      .setTitle("ロール選択パネル")
      .setDescription(`${label1}\n\n**【対象ロール】**\n${roleListText}`)
      .setColor('Blue');

    // --- SelectMenu の作成 ---
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('menu_dynamic')
      .setPlaceholder(`▼ ロールを選択`)
      .addOptions(menuRoles);

    //--- 送信 ---
    try {
      await targetChannel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(selectMenu)]
      });

      await interaction.reply({
        content: `<#${targetChannel.id}> にパネルを設置しました！`,
        ephemeral: true
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'パネルの送信に失敗しました。',
        ephemeral: true
      });
    }
  },
};

//================