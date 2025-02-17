import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { addDomain, isValidFQDN, DomainError } from '../utils/domainUtils';

export const addDomainCommand = new SlashCommandBuilder()
  .setName('add-domain')
  .setDescription('Add a domain to monitor')
  .addStringOption((option) =>
    option
      .setName('domain')
      .setDescription('monitoring domain\'s FQDN')
      .setRequired(true)
  );

export async function runAddDomain(interaction: ChatInputCommandInteraction) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply('This command can only be used in a guild.');
      return;
    }

    const domain = interaction.options.getString('domain', true).trim();

    if (!isValidFQDN(domain)) {
      await interaction.reply(`${domain} is not valid domain or FQDN\nEx: \`example.com\` or \`alice.example.com\``);
      return;
    }

    await addDomain(guildId, domain);
    await interaction.reply(`\`${domain}\` has been added.`);
  } catch (error) {
    if (error instanceof DomainError) {
      if (error.reasonCode === 'ALREADY_EXISTS') {
        await interaction.reply(`⚠️ \`${error.domain}\` is already registered.`);
      } else {
        await interaction.reply('An error occurred while adding the domain.');
      }
    } else {
      console.error('❌ add-domain実行エラー:', error);
      process.stderr.write(`add-domain実行エラー: ${error}\n`);
      throw error;
    }
  }
}
