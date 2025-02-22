import { Client, GatewayIntentBits, REST, Routes, Events, Guild, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { commandDefs, commandHandlers } from './commands';
import { handlePageButton } from './commands/listDomains';
import {disconnectChannel} from "./utils/channelConfig";
import {clearAllDomains} from "./utils/domainUtils";

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID!;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// スラッシュコマンドの登録
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    if (commandDefs.length === 0) {
      console.error('❌ スラッシュコマンドが登録されていません。');
      throw new Error('No commands to register');
    }
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandDefs.map(cmd => cmd.toJSON()),
    });
    for (const command of commandDefs) {
      console.log(`✔ Command: \`/${command.name}\``);
    }
    console.log('✅ スラッシュコマンド登録完了');
  } catch (error) {
    console.error('❌ スラッシュコマンド登録エラー:', error);
    process.stderr.write(`スラッシュコマンド登録エラー: ${error}\n`);
  }
}

// クライアントの準備
client.once('ready', async () => {
  console.log(`Logged in as "${client.user?.tag}"`);
  await registerCommands();
});

// インタラクションのハンドリング
client.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const handler = commandHandlers[interaction.commandName as keyof typeof commandHandlers];
    if (handler) {
      try {
        await handler(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'next_page' || interaction.customId === 'prev_page') {
      await handlePageButton(interaction);
    }
  }
});

// サーバーからキックされた時
client.on(Events.GuildDelete, async (guild: Guild) => {
  console.log(`ボットはサーバーから削除されました: ${guild.name} (ID: ${guild.id})`);
  // 通知チャンネルの切断
  await disconnectChannel(guild.id);
  // データベースからの削除
  await clearAllDomains(guild.id);
});


// エラーイベントのハンドリングを追加
client.on('error', (error) => {
  console.error('❌ Discord クライアントエラー:', error);
  process.stderr.write(`Discord クライアントエラー: ${error}\n`);
});

client.login(TOKEN).catch(error => {
  console.error('❌ ログインエラー:', error);
  process.stderr.write(`ログインエラー: ${error}\n`);
});
