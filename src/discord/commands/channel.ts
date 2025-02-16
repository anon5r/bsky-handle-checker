import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import {
  connectChannel,
  disconnectChannel,
  getConnectChannelId,
  isConnectChannelRegistered
} from '../utils/channelConfig';

export const channelCommand = new SlashCommandBuilder()
  .setName('channel')
  .setDescription('通知チャンネルの設定')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageChannels
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('connect')
      .setDescription('Botの通知先チャンネルを設定します')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('通知先にしたいテキストチャンネル')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('disconnect')
      .setDescription('Botの通知先チャンネルを解除します')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('current')
      .setDescription('現在の通知先チャンネルを表示します')
  );

export async function runChannelCommand(interaction: ChatInputCommandInteraction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    if (!guildId || !guild) {
      await interaction.reply('このコマンドはインストールされたサーバー内でのみ実行できます。');
      return;
    }


    switch (subcommand) {
      case 'connect': {
        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
          await interaction.reply('⚠️ チャンネルの管理権限が必要です。');
          return;
        }
        const channel = interaction.options.getChannel('channel', true);
        await connectChannel(guildId, channel.id);
        await interaction.reply(`通知先チャンネルを <#${channel.id}> に設定しました。`);
        break;
      }
      case 'disconnect': {
        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
          await interaction.reply('⚠️ チャンネルの管理権限が必要です。');
          return;
        }
        await disconnectChannel(guildId);
        await interaction.reply('通知先チャンネル設定を解除しました。');
        break;
      }
      case 'current': {
        if (!await isConnectChannelRegistered(guildId)) {
          await interaction.reply('⚠️ 通知先チャンネルは設定されていません。');
          break;
        }
        const channelId = await getConnectChannelId(guildId);
        const embed = new EmbedBuilder()
          .setTitle('通知チャンネル設定')
          .setDescription(channelId
            ? `現在の通知先: <#${channelId}>`
            : '⚠️ 通知先チャンネルは設定されていません');
        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  } catch (error) {
    console.error('❌ channel実行エラー:', error);
    process.stderr.write(`channel実行エラー: ${error}\n`);
    throw error;
  }
}
