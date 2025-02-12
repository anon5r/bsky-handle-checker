import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { loadDomains, saveDomains, isValidFQDN } from '../utils/domainUtils';

export const addDomainCommand = new SlashCommandBuilder()
  .setName('add-domain')
  .setDescription('監視対象のドメインを追加')
  .addStringOption((option) =>
    option
      .setName('domain')
      .setDescription('追加したいドメイン')
      .setRequired(true)
  );

/**
 * /add-domain 実行時の処理
 */
export async function runAddDomain(interaction: ChatInputCommandInteraction) {
  // ギルド内でのみ実行可
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

