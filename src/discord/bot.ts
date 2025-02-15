import { Client, GatewayIntentBits, REST, Routes, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { commandDefs, commandHandlers } from './commands';

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

client.once('ready', async () => {
  console.log(`Logged in as "${client.user?.tag}"`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const handler = commandHandlers[interaction.commandName as keyof typeof commandHandlers];
  if (handler) {
    try {
      await handler(interaction);
    } catch (error) {
      console.error(`❌ コマンド実行エラー [${interaction.commandName}]:`, error);
      process.stderr.write(`コマンド実行エラー [${interaction.commandName}]: ${error}\n`);
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
  }
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
