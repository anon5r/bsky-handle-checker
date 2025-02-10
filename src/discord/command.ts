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
  ButtonInteraction,
} from 'discord.js';
import * as fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import psl from 'psl';

dotenv.config();

const DOMAINS_FILE = path.join(__dirname, '../../data/domains.json');
const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID as string;
const itemsPerPage = 30;

if (!TOKEN || !CLIENT_ID) {
  throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_BOT_CLIENT_ID in environment variables.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ファイルパスをGuildごとに生成する関数
function getGuildDomainsPath(guildId: string): string {
  return path.join(__dirname, '../../data/guilds', guildId, 'domains.json');
}


// ドメインの読み込み関数を更新
async function loadDomains(guildId: string): Promise<string[]> {
  const domainsPath = getGuildDomainsPath(guildId);
  try {
    await fs.mkdir(path.dirname(domainsPath), { recursive: true });
    const data = await fs.readFile(domainsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await saveDomains(guildId, []);
      return [];
    } else {
      console.error('Failed to load domains:', err);
      throw err;
    }
  }
}

// ドメインの保存関数を更新
async function saveDomains(guildId: string, domains: string[]): Promise<void> {
  const domainsPath = getGuildDomainsPath(guildId);
  try {
    await fs.mkdir(path.dirname(domainsPath), { recursive: true });
    await fs.writeFile(domainsPath, JSON.stringify(domains, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save domains:', error);
    throw error;
  }
}


// Embedページの作成
/**
 * ページング用のEmbedを作成する関数
 * @param domains
 * @param itemsPerPage
 * @param page
 */
function createPageEmbed(domains: string[], itemsPerPage: number, page: number): EmbedBuilder {
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

/**
 * ページボタンの作成
 * @param currentPage
 * @param totalPages
 */
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

/**
 * ページボタンの処理
 * @param currentPage
 * @param buttonId
 */
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

// コマンドハンドラー関数群
/**
 * ドメインFQDNの検証
 * @param domain
 */
function isValidFQDN(domain: string): boolean {
  // 基本的なFQDN形式チェック
  const fqdnRegex = /^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.)+[a-z]{2,})$/i;
  if (!fqdnRegex.test(domain)) {
    return false;
  }

  // PSLを使用したドメイン検証
  const parsed = psl.parse(domain);
  if ('error' in parsed) {
    return false;
  }
  return parsed.tld !== null && parsed.domain !== null;
}


/**
 * ドメインの追加処理
 * @param interaction
 */
async function handleAddDomain(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply('このコマンドはサーバー内でのみ使用できます');
    return;
  }

  const domain = interaction.options.getString('domain', true);

  if (!isValidFQDN(domain)) {
    await interaction.reply(`${domain} は有効なドメイン名ではありません。\n例: example.com`);
    return;
  }

  const domains = await loadDomains(guildId);
  if (domains.includes(domain)) {
    await interaction.reply(`\`${domain}\` は既に登録されています`);
    return;
  }

  domains.push(domain);
  await saveDomains(guildId, domains);
  await interaction.reply(`\`${domain}\`を追加しました`);
}


/**
 * ドメインの削除処理
 * @param interaction
 */
async function handleRemoveDomain(interaction: ChatInputCommandInteraction) {
  const domain = interaction.options.getString('domain', true);
  const domains = await loadDomains(interaction.guildId as string);

  const index = domains.indexOf(domain);
  if (index === -1) {
    await interaction.reply(`\`${domain}\` は登録されていません`);
    return;
  }

  domains.splice(index, 1);
  await saveDomains(interaction.guildId as string, domains);
  await interaction.reply(`\`${domain}\` を削除しました`);
}

/**
 * ドメイン一覧表示処理
 * @param interaction
 */
async function handleListDomains(interaction: ChatInputCommandInteraction) {
  const domains = await loadDomains(interaction.guildId as string);

  if (domains.length === 0) {
    await interaction.reply('監視対象のドメインはありません');
    return;
  }

  const currentPage = 1;  // 初期ページ
  const pages = Math.ceil(domains.length / itemsPerPage);
  const embed = createPageEmbed(domains, itemsPerPage, currentPage);
  const row = createPageButtons(currentPage, pages);

  await interaction.reply({
    embeds: [embed],
    components: (domains.length > itemsPerPage) ? [row] : []
  });
}


/**
 * ボタンインタラクションの処理
 * @param interaction
 */
async function handleButtonInteraction(interaction: ButtonInteraction) {
  const domains = await loadDomains(interaction.guildId as string);
  const currentPage = getCurrentPageFromEmbed(interaction);
  const pages = Math.ceil(domains.length / itemsPerPage);
  const newPage = updatePageNumber(currentPage, interaction.customId);

  const newEmbed = createPageEmbed(domains, itemsPerPage, newPage);
  const newButtons = createPageButtons(newPage, pages);

  await interaction.update({
    embeds: [newEmbed],
    components: [newButtons]
  });
}



// クライアントのイベントリスナーを追加
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      switch (commandName) {
        case 'add-domain':
          await handleAddDomain(interaction);
          break;
        case 'remove-domain':
          await handleRemoveDomain(interaction);
          break;
        case 'list-domains':
          await handleListDomains(interaction);
          break;
      }
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
  } catch (error) {
    console.error('エラー:', error);
    if (interaction.isButton()) {
      await interaction.update({
        content: 'エラーが発生しました。もう一度お試しください。',
        components: []
      });
    } else if (interaction.isRepliable()) {
      await interaction.reply('エラーが発生しました。もう一度お試しください。');
    }
  }
});


client.login(TOKEN);
