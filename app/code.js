const { Client} = require("discord.js");
const { DynamicLoader } = require("bcdice");
const { UserDefinedDiceTable } = require("bcdice");
const wait = require("util");
const options = { intents: ["GUILDS", "GUILD_MESSAGES"] };
const client = new Client(options);
const {
  Modal,
  TextInputComponent,
  TextInputStyle,
  MessageActionRow,
  MessageEmbed,
  MessageButton,
} = require("discord.js");


client.on("ready", (message) => {
  console.log("Bot準備完了！");
});

//ここから
const ROLE_ID = '1230813869216235530';

var inputData; //送信データ

var storeData; //再入力時私用データ

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
  "/macros/s/AKfycbw9gugqlIQsd2DxCCSckWN0BLu3PHcOcB1o2ktjHJAsKmbrLOyWuxK3qxKee23FIFISUw/exec"; // gasのドメイン以降のurl
const data = { key: "value" }; // 送信するデータ

const axios = axiosBase.create({
  baseURL: "https://script.google.com",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  responseType: "json",
});
//ここまで

//コマンド処理内容の記述
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
    const lang = interaction.options.get("language");
    return interaction.reply(source[lang.value](name));
  },
  //挨拶ここまで

  //日程入力
  async add(interaction) {
    const modal = createModal_add("input", "予定の入力");
    await interaction.showModal(modal);
  },
  //日程入力ここまで

  //日程閲覧
  async show(interaction) {
    const source = {
      sp() {
        return `[スプレッドシートリンク](<${sp_url}>)`;
      },
      ca() {
        return `[カレンダーリンク](<${ca_url}>)`;
      },
    };
    const type = interaction.options.get("type");
    return await interaction.reply({
      content: source[type.value](),
      ephemeral: true,
    });
  },

  //日程削除
  async deletes(interaction) {
    const modal = new Modal().setCustomId("deletes").setTitle("予定の削除");

    const DeleteID = new TextInputComponent()
      .setCustomId("Delete")
      .setLabel("削除したいスケジュールのIDを入力")
      .setStyle("SHORT");

    modal.addComponents(new MessageActionRow().addComponents(DeleteID));

    await interaction.showModal(modal);
  },
  //日程削除ここまで
  
  //日程修正
  async corrects(interaction) {
    const modal = createModal_correct("corrects", "予定の修正");
    await interaction.showModal(modal);
  },
  //日程修正ここまで
  
  //日程検索
  async searchs(interaction) {
    const modal = new Modal().setCustomId("searchs").setTitle("日付から予定を検索");

    const search = new TextInputComponent()
      .setCustomId("Search")
      .setLabel("検索したい予定の日付を入力(yyyy/mm/dd)")
      .setStyle("SHORT")
      .setPlaceholder("ex)2025/07/05");

    modal.addComponents(new MessageActionRow().addComponents(search));

    await interaction.showModal(modal);
  },
  
  //日程検索ここまで

  //おみくじ
  async omikuji(interaction) {
    const rollResult = await diceroll(
      "DiceBot",
      "choice[大吉,吉,中吉,小吉,末吉,凶]"
    );
    return interaction.reply(rollResult.text.slice(27));
  },
};
//スラッシュコマンド処理終了

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    return commands[interaction.commandName](interaction);
  }

  else if (interaction.isButton()){
  	if (interaction.customId === 'retryDate') {
    	const modal = createModal_add("input", "予定の入力",storedata);

		await interaction.deferUpdate();
    	await interaction.showModal(modal);
  	}
  }

  //Modal入力処理
  else if (interaction.isModalSubmit()) {
    if (interaction.customId == "input") {

	　//日付入力が正しくない場合
	  const regulation = /^\d{4}\/\d{2}\/\d{2}$/;
	  if(!regulation.test(interaction.fields.getTextInputValue("inputSecond"))){
		const retrybutton = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId('retryDate')
				.setLabel('再入力')
				.setStyle('PRIMARY')
		);

		const d1 = interaction.fields.getTextInputValue("inputFirst");
      	const d3 = interaction.fields.getTextInputValue("inputThird");
      	const d4 = interaction.fields.getTextInputValue("inputFour");

		storedata = [d1,d3,d4];

	　	await interaction.reply({
      		content: '入力エラー！「yyyy/mm/dd」で入力してください。',
      		components: [retrybutton],
      		ephemeral: true,
    	});
    	return;	  
	  }

	  else{
      	const d1 = interaction.fields.getTextInputValue("inputFirst");
      	const d2 = interaction.fields.getTextInputValue("inputSecond");
      	const d3 = interaction.fields.getTextInputValue("inputThird");
      	const d4 = interaction.fields.getTextInputValue("inputFour");

      	//データを配列に格納してモジュールに渡す
      	const dataList = [[d1], [d2], [d3], [d4]];
      	inputData = sendData(dataList, interaction.customId);
      
      	await interaction.reply({
        	content: "データの追加が完了しました",
        	ephemeral: true,
      	});
      
      	const info = new MessageEmbed()
	    	.setColor(0x0099FF)
	    	.setTitle(d1)	//シナリオ名
      		.setDescription('(シナリオ名をクリックでカレンダーが表示されます)')
	    	.setURL(ca_url)	//カレンダーurl
	    	.addFields(
		    	{ name: '日時：', value: d2 },
		    	{ name: 'KP：', value: d3 },
		    	{ name: 'PL：', value: d4 },
	    	)
      
      	try {
          	client.channels.cache.get('1141934435562946590').send({ embeds: [info] });
          	return;
      	} catch {
        	return;
      	}
	  }
    } else if (interaction.customId == "deletes") {
      const deleteID = interaction.fields.getTextInputValue("Delete");

      //データを配列に格納してモジュールに渡す
      const dataList = [[deleteID]];
      inputData = sendData(dataList, interaction.customId);

      await interaction.reply({
        content: "データの削除が完了しました",
        ephemeral: true,
      });
    }
    else if (interaction.customId == "corrects") {
      const correctID = interaction.fields.getTextInputValue("correctID");
      const d1 = interaction.fields.getTextInputValue("title");
      const d2 = interaction.fields.getTextInputValue("date");
      const d3 = interaction.fields.getTextInputValue("kp");
      const d4 = interaction.fields.getTextInputValue("pl");
          
      //データを配列に格納してモジュールに渡す
      const dataList = [[correctID] ,[d1], [d2], [d3], [d4]];
      inputData = sendData(dataList, interaction.customId);

      await interaction.reply({
        content: "データの修正が完了しました",
        ephemeral: true,
      });
    }   
     else if (interaction.customId == "searchs") {
      const date = interaction.fields.getTextInputValue("Search");

      //データを配列に格納してモジュールに渡す
      const dataList = [[date]];
      inputData = sendData(dataList, interaction.customId);

      await interaction.reply({
        content: "日程検索が完了しました。：" + date,
        ephemeral: false,
      });
    }

  } else return;
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  //CoC
  if (message.content.match(/^(coc|coc7) /i)) {
    //CoC6th
    if (message.content.match(/^coc /i)) {
      var rollResult = await diceroll("Cthulhu", message.content.slice(4));
      try {
        message.channel.send(rollResult.text);
      } catch {
        return;
      }
    }

    //CoC7th
    if (message.content.match(/^coc7 /i)) {
      var rollResult = await diceroll("Cthulhu7th", message.content.slice(5));
      try {
        message.channel.send(rollResult.text);
      } catch {
        return;
      }
    }
    return;
  }

  //シノビガミ
  if (message.content.match(/^(sinobi )/i)) {
    var rollResult = await diceroll("ShinobiGami", message.content.slice(7));
    try {
      message.channel.send(rollResult.text);
    } catch {
      return;
    }
  }

  //SW2.5
  if (message.content.match(/^(SW )/i)) {
    var rollResult = await diceroll("SwordWorld2.5", message.content.slice(3));
    try {
      message.channel.send(rollResult.text);
    } catch {
      return;
    }
  }
  
  //DiceBot
  if (
    message.content.match(
      /^S?([+\-(]*(\d+|D\d+)|\d+B\d+|\d+T[YZ]\d+|C[+\-(]*\d+|choice|D66|(repeat|rep|x)\d+|\d+R\d+|\d+U\d+|BCDiceVersion)/i
    )
  ) {
    var rollResult = await diceroll("DiceBot", message.content);
    try {
      message.channel.send(rollResult.text);
    } catch {
      return;
    }
  }
  
  //オリジナル表
  if (message.content.match(/^(table )/i)) {
    var str = message.content; //.Split('\n');
    
  const contents = new UserDefinedDiceTable(str);
  var rollResult = contents.roll();
    try {
      message.channel.send(rollResult.text);
    } catch {
      return;
    }
  } 
});


//ModalWindow(add)を作成するモジュール
function createModal_add(customId, title, defaults = ['','', '']) {
  const makingModal = new Modal().setCustomId(customId).setTitle(title);
  const InputTitle = new TextInputComponent()
    .setCustomId("inputFirst")
    .setLabel("シナリオ名")
    .setStyle("SHORT")
	.setRequired(true)
	.setValue(defaults[0] || '');
  const InputDate = new TextInputComponent()
    .setCustomId("inputSecond")
    .setLabel("日時(yyyy/mm/dd)")
    .setStyle("SHORT")
    .setPlaceholder("ex)2025/07/05")
	.setRequired(true);
  const InputKPname = new TextInputComponent()
    .setCustomId("inputThird")
    .setLabel("KP名を入力")
    .setStyle("SHORT")
	.setRequired(true)
	.setValue(defaults[1] || '');
  const InputPLname = new TextInputComponent()
    .setCustomId("inputFour")
    .setLabel("PL名を入力")
    .setStyle("SHORT")
	.setRequired(true)
	.setValue(defaults[2] || '');

  makingModal.addComponents(new MessageActionRow().addComponents(InputTitle));
  makingModal.addComponents(new MessageActionRow().addComponents(InputDate));
  makingModal.addComponents(new MessageActionRow().addComponents(InputKPname));
  makingModal.addComponents(new MessageActionRow().addComponents(InputPLname));

  return makingModal;
}

//ModalWindow(correct)を作成するモジュール
function createModal_correct(customId,title){
  const makingModal = new Modal().setCustomId(customId).setTitle(title);
    
  const data = {
  correctID: new TextInputComponent()
    .setCustomId("correctID")
    .setLabel("修正したいスケジュールのIDを入力")
    .setStyle(`SHORT`)
    .setRequired(true),
      
  d1: new TextInputComponent()
    .setCustomId(`title`)
    .setLabel("シナリオ名")
    .setStyle("SHORT")
    .setRequired(false)
    .setPlaceholder("修正しない場合は未記入"),
      
  d2: new TextInputComponent()
    .setCustomId(`date`)
    .setLabel("日時(yyyy/mm/dd)")
    .setStyle("SHORT")
    .setRequired(false)
    .setPlaceholder("修正しない場合は未記入"),
      
  d3: new TextInputComponent()
    .setCustomId(`kp`)
    .setLabel("KP名を入力")
    .setStyle("SHORT")
    .setRequired(false)
    .setPlaceholder("修正しない場合は未記入"),
      
  d4: new TextInputComponent()
    .setCustomId(`pl`)
    .setLabel("PL名を入力")
    .setStyle("SHORT")
    .setRequired(false)
    .setPlaceholder("修正しない場合は未記入")
  }

    makingModal.addComponents(new MessageActionRow().addComponents(data.correctID),
                        new MessageActionRow().addComponents(data.d1),
                        new MessageActionRow().addComponents(data.d2),
                        new MessageActionRow().addComponents(data.d3),
                        new MessageActionRow().addComponents(data.d4));
  
  return makingModal;
}

//ModalWindowの入力値を送信するモジュール
function sendData(postList, customId) {
  postData = [100, postList, customId];

  axios.post(url, postData).then(async function (response) {
    responseData = response.data; // 受け取ったデータを格納
    console.log(postData);
  });
  return responseData;
}

//ダイスロールのモジュール
async function diceroll(system, roll) {
  const loader = new DynamicLoader();
  const GameSystem = await loader.dynamicLoad(system);
  const result = GameSystem.eval(roll);
  return result;
}
//ここまで


client.login(process.env.DISCORD_BOT_TOKEN);
