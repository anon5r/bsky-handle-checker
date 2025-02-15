import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { addDomain, isValidFQDN } from '../utils/domainUtils';

export const addDomainCommand = new SlashCommandBuilder()
  .setName('add-domain')
  .setDescription('監視対象のドメインを追加')
  .addStringOption((option) =>
    option
      .setName('domain')
      .setDescription('追加したいドメイン')
      .setRequired(true)
  );

export async function runAddDomain(interaction: ChatInputCommandInteraction) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply('このコマンドはサーバー内でのみ使用できます');
      return;
    }

    const domain = interaction.options.getString('domain', true).trim();

    if (!isValidFQDN(domain)) {
      await interaction.reply(`${domain} は有効なドメイン名ではありません。\n例: example.com`);
      return;
    }

    await addDomain(guildId, domain);
    await interaction.reply(`\`${domain}\`を追加しました`);
  } catch (error) {
    console.error('❌ add-domain実行エラー:', error);
    process.stderr.write(`add-domain実行エラー: ${error}\n`);
    throw error;
  }
}
