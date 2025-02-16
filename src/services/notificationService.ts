import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import Database from 'better-sqlite3';
import path from 'path';

interface NotificationResult {
  success: boolean;
  error?: string;
}

export class NotificationService {
  private client: Client;
  private db: Database.Database;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds]
    });

    this.db = new Database(path.join(process.cwd(), 'data', 'database.sqlite'), {
      verbose: console.log
    });
  }

  async initialize(): Promise<void> {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not set.');
    }
    await this.client.login(process.env.DISCORD_BOT_TOKEN);
  }

  async getChannelId(guildId?: string): Promise<string> {

    if (!guildId) {
      throw new Error('No guild ID provided');
    }

    const channelData = this.db.prepare(`
      SELECT channel_id 
      FROM guild_channels 
      WHERE guild_id = ?
    `).get(guildId) as { channel_id: string };

    if (!channelData) {
      throw new Error('No notification channel found');
    }

    return channelData.channel_id;
  }

  async sendNotification(content: string, channelId: string): Promise<NotificationResult> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error('Invalid channel or channel type');
      }

      await channel.send(content);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async close(): Promise<void> {
    this.db.close();
    this.client.destroy();
  }
}
