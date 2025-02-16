import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { loadDomains, removeDomain } from '../utils/domainUtils';

export const removeDomainCommand = new SlashCommandBuilder()
  .setName('remove-domain')
  .setDescription('Remove a domain from monitoring')
  .addStringOption((option) =>
    option
      .setName('domain')
      .setDescription('Remove domain')
      .setRequired(true)
  );

export async function runRemoveDomain(interaction: ChatInputCommandInteraction) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply('This command can only be used in a guild.');
      return;
    }

    const domain = interaction.options.getString('domain', true).trim();
    const domains = await loadDomains(guildId);

    if (!domains.includes(domain)) {
      await interaction.reply({ content: `\`${domain}\` does not exist.` });
      return;
    }

    await removeDomain(guildId, domain);
    await interaction.reply(`\`${domain}\` has been removed.`);
  } catch (error) {
    console.error('❌ remove-domain実行エラー:', error);
    process.stderr.write(`remove-domain実行エラー: ${error}\n`);
    throw error;
  }
}
