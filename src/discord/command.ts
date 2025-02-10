import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as fs from 'fs/promises';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

const DOMAINS_FILE = path.join(__dirname, '../../data/domains.json');
const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID as string;

console.log('Environment variables loaded:', {
  token: TOKEN ? TOKEN : undefined,
  clientId: CLIENT_ID
});

if (!TOKEN || !CLIENT_ID) {
  throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_BOT_CLIENT_ID in environment variables.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ドメインの読み込み
async function loadDomains(): Promise<string[]> {
  try {
    const data = await fs.readFile(DOMAINS_FILE, 'utf-8');
    console.log('Loaded domains:', data);
    return JSON.parse(data);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      // ファイルが存在しない場合、新規作成
      await saveDomains([]);
      return [];
    } else {
      console.error('Failed to load domains:', err);
      throw err;
    }
  }
}

// ドメインの保存
async function saveDomains(domains: string[]): Promise<void> {
  try {
    await fs.writeFile(DOMAINS_FILE, JSON.stringify(domains, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save domains:', error);
    throw error;
  }
}

// スラッシュコマンドの定義
const commands = [
  new SlashCommandBuilder()
    .setName('add-domain')
    .setDescription('監視対象のドメインを追加')
    .addStringOption((option) =>
      option.setName('domain')
        .setDescription('追加するドメイン')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('remove-domain')
    .setDescription('監視対象のドメインを削除')
    .addStringOption((option) =>
      option.setName('domain')
        .setDescription('削除するドメイン')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('list-domains')
    .setDescription('監視対象のドメイン一覧を表示'),
];

// REST API を使用してコマンドを登録
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map((cmd) => cmd.toJSON()) });
    console.log('スラッシュコマンドを登録しました');
  } catch (error) {
    console.error('スラッシュコマンド登録エラー:', error);
  }
});

// コマンドハンドリング
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log('Command received:', {
    name: interaction.commandName,
    options: interaction.options.data,
    user: interaction.user.tag,
    guild: interaction.guild?.name
  });
  const { commandName, options } = interaction as ChatInputCommandInteraction;

  try {
    switch (commandName) {
      case 'add-domain': {
        const domain = options.getString('domain', true);
        const domains = await loadDomains();

        if (domains.includes(domain)) {
          await interaction.reply(`${domain} は既に登録されています`);
          return;
        }

        domains.push(domain);
        await saveDomains(domains);
        await interaction.reply(`${domain} を追加しました`);
        break;
      }
      case 'remove-domain': {
        const domain = options.getString('domain', true);
        const domains = await loadDomains();

        const index = domains.indexOf(domain);
        if (index === -1) {
          await interaction.reply(`${domain} は登録されていません`);
          return;
        }

        domains.splice(index, 1);
        await saveDomains(domains);
        await interaction.reply(`${domain} を削除しました`);
        break;
      }
      case 'list-domains': {
        const domains = await loadDomains();
        const message =
          domains.length > 0
            ? `監視対象ドメイン一覧:\n${domains.join('\n')}`
            : '監視対象のドメインはありません';
        await interaction.reply(message);
        break;
      }
    }
  } catch (error) {
    console.error('エラー:', error);
    await interaction.reply('エラーが発生しました');
  }
});

// Discord Bot のログイン
client.login(TOKEN);


