import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {loadDomainsWithPagination} from '../utils/domainUtils';

const itemsPerPage = 30;

export const listDomainsCommand = new SlashCommandBuilder()
  .setName('list-domains')
  .setDescription('List of monitored domains');

/**
 * /list-domains 実行時の処理
 * @param interaction
 */
export async function runListDomains(interaction: ChatInputCommandInteraction) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply('This command can only be used in a guild.');
      return;
    }

    const page = 1;
    const { domains, total } = await loadDomainsWithPagination(guildId, page, itemsPerPage);
    const totalPages = Math.ceil(total / itemsPerPage);

    const embed = createPageEmbed(domains, total, page, totalPages);
    const row = createPageButtons(page, totalPages);

    await interaction.reply({
      embeds: [embed],
      components: totalPages > 1 ? [row] : [],
    });
  } catch (error) {
    console.error('❌ list-domains実行エラー:', error);
    process.stderr.write(`list-domains実行エラー: ${error}\n`);
    throw error;
  }
}

/**
 * ページネーションのボタンを作成
 * @param interaction
 */
export async function handlePageButton(interaction: ButtonInteraction) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const currentPage = parseInt(interaction.message.embeds[0].footer?.text.split('/')[0].split(' ')[1] || '1');
    const newPage = interaction.customId === 'next_page' ? currentPage + 1 : currentPage - 1;

    const { domains, total } = await loadDomainsWithPagination(guildId, newPage, itemsPerPage);
    const totalPages = Math.ceil(total / itemsPerPage);

    const embed = createPageEmbed(domains, total, newPage, totalPages);
    const row = createPageButtons(newPage, totalPages);

    await interaction.update({
      embeds: [embed],
      components: totalPages > 1 ? [row] : [],
    });
  } catch (error) {
    console.error('❌ ページ遷移エラー:', error);
    process.stderr.write(`ページ遷移エラー: ${error}\n`);
    throw error;
  }
}

/**
 * ページのEmbedを作成
 * @param domains
 * @param total
 * @param page
 * @param totalPages
 */
function createPageEmbed(domains: string[], total: number, page: number, totalPages: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('List of Monitored Domains')
    .setDescription(`Total ${total}`)
    .addFields({ name: 'Monitored domains', value: domains.join('\n') || 'None' })
    .setFooter({ text: `Page ${page}/${totalPages}` });
}


/**
 * ページネーションのボタンを作成
 * @param currentPage
 * @param totalPages
 */
function createPageButtons(
  currentPage: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('« Prev')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('Next »')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage >= totalPages)
    );
}
