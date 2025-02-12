import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { loadDomains, saveDomains } from '../utils/domainUtils';

export const removeDomainCommand = new SlashCommandBuilder()
  .setName('remove-domain')
  .setDescription('監視対象のドメインを削除')
  .addStringOption((option) =>
    option
      .setName('domain')
      .setDescription('削除したいドメイン')
      .setRequired(true)
  );

/**
 * /remove-domain 実行時の処理
 */
export async function runRemoveDomain(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply('このコマンドはギルド内でのみ実行できます。');
    return;
  }

  const domain = interaction.options.getString('domain', true).trim();
  const domains = await loadDomains(guildId);

  const index = domains.indexOf(domain);
  if (index === -1) {
    await interaction.reply({ content: `\`${domain}\` は登録されていません。` });
    return;
  }

  // 削除
  domains.splice(index, 1);
  await saveDomains(guildId, domains);

  await interaction.reply(`ドメイン \`${domain}\` を削除しました。`);
}
