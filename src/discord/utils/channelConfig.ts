import { db } from '../../database';
import {GuildBasedChannel, PermissionFlagsBits, TextChannel} from "discord.js";

export async function getConnectChannelId(guildId: string): Promise<string | null> {
  const result: any = db.prepare(
    'SELECT channel_id FROM guild_channels WHERE guild_id = ?'
  ).get(guildId);

  return result ? result.channel_id : null;
}

export async function isConnectChannelRegistered(guildId: string): Promise<boolean> {
  const result = db.prepare(
    'SELECT channel_id FROM guild_channels WHERE guild_id = ?'
  ).get(guildId);

  return !!result;
}

export async function connectChannel(guildId: string, channelId: string): Promise<void> {
  db.prepare(`
    INSERT INTO guild_channels (guild_id, channel_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
    channel_id = ?,
    updated_at = CURRENT_TIMESTAMP
  `).run(guildId, channelId, channelId);
}

export async function disconnectChannel(guildId: string): Promise<void> {
  db.prepare('DELETE FROM guild_channels WHERE guild_id = ?').run(guildId);
}

/**
 * チャンネルがパブリックかどうかを確認します。
 * @param channel
 */
export async function isChannelPublic(channel: GuildBasedChannel): Promise<boolean> {
  if (!channel.isTextBased()) {
    throw new Error('Not a text channel');
  }

  // `@everyone` ロールを取得
  const everyoneRole = channel.guild.roles.everyone;
  const permissions = channel.permissionsFor(everyoneRole);

  // 権限情報を取得できなかった場合、プライベートとみなす
  if (!permissions)
    return false;

  return permissions.has(PermissionFlagsBits.ViewChannel);
}
