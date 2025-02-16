import { db } from '../../database';

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

