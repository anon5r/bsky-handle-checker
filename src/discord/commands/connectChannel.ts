// src/commands/connectChannel.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType, CategoryChannel,
} from 'discord.js';
import { saveConnectChannel } from '../utils/channelConfig';

export const connectChannelCommand = new SlashCommandBuilder()
  .setName('connect-channel')
  .setDescription('Botの連携先チャンネルを設定します')
  // テキストチャンネルを指定必須に
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('連携先にしたいテキストチャンネル')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  // コマンドを使える権限を管理者またはチャンネル管理者に制限
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageChannels
  );

// 実際の処理ロジック
export async function runConnectChannel(interaction: ChatInputCommandInteraction) {
  // オプションで指定されたチャンネルを取得
  const channel = interaction.options.getChannel('channel', true, [ChannelType.GuildText]);

// ギルドIDを取得
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'サーバー内でのみ使用できます。'});
    return;
  }

  // DB(またはファイル)へ保存
  try {
    await saveConnectChannel(guildId, channel.id);
    await interaction.reply(
      `チャンネル <#${channel.id}> をハンドル検出時の連携先として設定しました！`
    );
  } catch (err) {
    console.error('[connectChannel] Error saving channel info:', err);
    await interaction.reply({ content: 'エラーが発生しました。' });
  }
}
