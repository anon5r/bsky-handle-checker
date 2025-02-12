import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { loadDomains } from '../utils/domainUtils';

const itemsPerPage = 30;

export const listDomainsCommand = new SlashCommandBuilder()
  .setName('list-domains')
  .setDescription('監視対象ドメイン一覧を表示');

/**
 * /list-domains 実行時の処理
 */
export async function runListDomains(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply('このコマンドはギルド内でのみ実行できます。');
    return;
  }

  const domains = await loadDomains(guildId);
  const totalPages = Math.ceil(domains.length / itemsPerPage) || 1;

  // 1ページ目のEmbed作成
  const embed = createPageEmbed(domains, itemsPerPage, 1);
  const row = createPageButtons(1, totalPages);

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

// ページEmbedの作成 (抜粋サンプル)
function createPageEmbed(domains: string[], itemsPerPage: number, page: number): EmbedBuilder {
  const startIndex = (page - 1) * itemsPerPage;
  const pageItems = domains.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(domains.length / itemsPerPage) || 1;

  return new EmbedBuilder()
    .setTitle('監視対象ドメイン一覧')
    .setDescription(`${domains.length} 件のドメイン`)
    .addFields({ name: 'ページ内ドメイン', value: pageItems.join('\n') || 'なし' })
    .setFooter({ text: `ページ ${page}/${totalPages}` });
}

// ページボタンの作成例
function createPageButtons(
  currentPage: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('前へ')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('次へ')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage >= totalPages)
    );
}
