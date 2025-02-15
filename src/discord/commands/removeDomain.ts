import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { loadDomains, removeDomain } from '../utils/domainUtils';

export const removeDomainCommand = new SlashCommandBuilder()
  .setName('remove-domain')
  .setDescription('監視対象のドメインを削除')
  .addStringOption((option) =>
    option
      .setName('domain')
      .setDescription('削除したいドメイン')
      .setRequired(true)
  );

export async function runRemoveDomain(interaction: ChatInputCommandInteraction) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply('このコマンドはギルド内でのみ実行できます。');
      return;
    }

    const domain = interaction.options.getString('domain', true).trim();
    const domains = await loadDomains(guildId);

    if (!domains.includes(domain)) {
      await interaction.reply({ content: `\`${domain}\` は登録されていません。` });
      return;
    }

    await removeDomain(guildId, domain);
    await interaction.reply(`ドメイン \`${domain}\` を削除しました。`);
  } catch (error) {
    console.error('❌ remove-domain実行エラー:', error);
    process.stderr.write(`remove-domain実行エラー: ${error}\n`);
    throw error;
  }
}
