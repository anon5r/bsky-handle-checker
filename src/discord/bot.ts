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
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandDefs.map(cmd => cmd.toJSON()),
    });
    console.log('✔ スラッシュコマンド登録完了');
  } catch (error) {
    console.error('❌ スラッシュコマンド登録エラー:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
  registerCommands();
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // コマンド名に対応するハンドラを呼び出す
  const handler = commandHandlers[interaction.commandName as keyof typeof commandHandlers];
  if (handler) {
    try {
      await handler(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
  }
});

client.login(TOKEN);
