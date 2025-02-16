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
  isConnectChannelRegistered,
  isChannelPublic
} from '../utils/channelConfig';

export const channelCommand = new SlashCommandBuilder()
  .setName('channel')
  .setDescription('Notification channel management')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageChannels
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('connect')
      .setDescription('Connect the notification channel for monitoring bot')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('The notification channel')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('disconnect')
      .setDescription('Disconnect the notification channel')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('current')
      .setDescription('Display the current notification channel')
  );

export async function runChannelCommand(interaction: ChatInputCommandInteraction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    if (!guildId || !guild) {
      await interaction.reply('This command can only be used in a guild.');
      return;
    }


    switch (subcommand) {
      case 'connect': {
        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
          await interaction.reply('⚠️ You must have the Manage Channels permission.');;
          return;
        }
        // const channel = interaction.options.getChannel('channel', true);
        const channelId = interaction.options.getChannel('channel', true).id;
        const channel = await guild.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
          await interaction.reply('⚠️ Please provide a valid text channel.');
          return;
        }
        if (!await isChannelPublic(channel)) {
          await interaction.reply('⚠️ Could not use private text channel.');
          return;
        }
        await connectChannel(guildId, channelId);
        await interaction.reply(`<#${channelId}> is now connected as the notification channel.`);
        break;
      }
      case 'disconnect': {
        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
          await interaction.reply('⚠️ You must have the Manage Channels permission.');;
          return;
        }
        await disconnectChannel(guildId);
        await interaction.reply('The notification channel setting has been disconnected.');
        break;
      }
      case 'current': {
        if (!await isConnectChannelRegistered(guildId)) {
          await interaction.reply('⚠️ Notify channel is not connected.');
          break;
        }
        const channelId = await getConnectChannelId(guildId);
        const embed = new EmbedBuilder()
          .setTitle('Notify Channel')
          .setDescription(channelId
            ? `Current: <#${channelId}>`
            : '⚠️ Notify channel is not connected');
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
