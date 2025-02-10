import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonInteraction
} from 'discord.js';
import * as fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DOMAINS_FILE = path.join(__dirname, '../../data/domains.json');
const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID as string;

if (!TOKEN || !CLIENT_ID) {
  throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_BOT_CLIENT_ID in environment variables.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ドメインの読み込み
async function loadDomains(): Promise<string[]> {
  try {
    const data = await fs.readFile(DOMAINS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
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

// Embedページの作成
function createPageEmbed(domains: string[], page: number): EmbedBuilder {
  const itemsPerPage = 25;
  const pages = Math.ceil(domains.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const pageItems = domains.slice(startIndex, startIndex + itemsPerPage);

  return new EmbedBuilder()
    .setTitle('監視対象ドメイン一覧')
    .setColor(0x0099FF)
    .setDescription(`登録済みドメイン数: ${domains.length}件`)
    .addFields({
      name: 'ドメイン一覧',
      value: pageItems.join('\n') || 'なし',
    })
    .setFooter({ text: `ページ ${page}/${pages}` });
}

// ページングボタンの作成
function createPageButtons(currentPage: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('前へ')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('次へ')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages)
    );
}

// 現在のページ番号を取得
function getCurrentPageFromEmbed(interaction: ButtonInteraction): number {
  const footer = interaction.message.embeds[0].footer?.text || '';
  return parseInt(footer.split('/')[0].replace('ページ ', '')) || 1;
}

// ページ番号の更新
function updatePageNumber(currentPage: number, buttonId: string): number {
  if (buttonId === 'next_page') return currentPage + 1;
  if (buttonId === 'prev_page') return currentPage - 1;
  return currentPage;
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

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map((cmd) => cmd.toJSON()) });
    console.log('スラッシュコマンドを登録しました');
  } catch (error) {
    console.error('スラッシュコマンド登録エラー:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName, options } = interaction;

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
          if (domains.length === 0) {
            await interaction.reply('監視対象のドメインはありません');
            return;
          }

          const currentPage = 1;
          const pages = Math.ceil(domains.length / 25);
          const embed = createPageEmbed(domains, currentPage);
          const row = createPageButtons(currentPage, pages);

          await interaction.reply({
            embeds: [embed],
            components: [row]
          });
          break;
        }
      }
    } else if (interaction.isButton()) {
      const domains = await loadDomains();
      const currentPage = getCurrentPageFromEmbed(interaction);
      const pages = Math.ceil(domains.length / 25);
      const newPage = updatePageNumber(currentPage, interaction.customId);

      const newEmbed = createPageEmbed(domains, newPage);
      const newButtons = createPageButtons(newPage, pages);

      await interaction.update({
        embeds: [newEmbed],
        components: [newButtons]
      });
    }
  } catch (error) {
    console.error('エラー:', error);
    if (interaction.isButton()) {
      await interaction.update({
        content: 'エラーが発生しました。もう一度お試しください。',
        components: []
      });
    } else if (interaction.isCommand() && interaction.isRepliable()) {
      await interaction.reply('エラーが発生しました。もう一度お試しください。');
    }
  }
});

client.login(TOKEN);
