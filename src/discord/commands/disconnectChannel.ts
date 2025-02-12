// src/commands/connectChannel.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType, CategoryChannel,
} from 'discord.js';
import { getConnectChannelId, clearConnectChannel } from '../utils/channelConfig';

export const disconnectChannelCommand = new SlashCommandBuilder()
  .setName('disconnect-channel')
  .setDescription('Botの連携先チャンネルを解除します')
  // コマンドを使える権限を管理者またはチャンネル管理者に制限
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageChannels
  );

// 実際の処理ロジック
export async function runDisconnectChannel(interaction: ChatInputCommandInteraction) {
  // ギルドIDを取得
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'サーバー内でのみ使用できます。'});
    return;
  }

  // DB(またはファイル)へ保存
  try {
    try {
      if (!await getConnectChannelId(guildId)) {
        await interaction.reply({content: '現在連携先チャンネルが設定されていません。'});
        return;
      }
    } catch (err) {
      await interaction.reply({content: '現在連携先チャンネルが設定されていません。'});
      return;
    }
    await clearConnectChannel(guildId);

    await interaction.reply(
      `連携先チャンネルを解除しました`
    );
  } catch (err) {
    console.error('[connectChannel] Error saving channel info:', err);
    await interaction.reply({ content: 'エラーが発生しました。' });
  }
}
