import {Client, Colors, EmbedBuilder, GatewayIntentBits, TextChannel} from 'discord.js';
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

  /**
   * ギルドの通知チャンネルIDを取得します。
   * @param guildId
   */
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

  /**
   * Send a notification to the specified channel.
   * @param content
   * @param channelId
   */
  async sendNotification(content: string|EmbedBuilder, channelId: string): Promise<NotificationResult> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error('Invalid channel or channel type');
      }
      if (content instanceof EmbedBuilder) {
        await channel.send({ embeds: [content] });
      } else {
        await channel.send(content);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private createMessage(domainName: string, did: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('Handle Detected')
      .setDescription(`**${domainName}** has been detected.`)
      .setTimestamp()
      .addFields(
        {name: 'Handle', value: `\`${domainName}\``, inline: true}
      )
      .addFields({name: 'DID', value: `\`${did}\``, inline: true})
      .setURL(`https://bsky.app/profile/${domainName}`);
  }


  async close(): Promise<void> {
    this.db.close();
    this.client.destroy();
  }

  async notifyDomainAvailability(): Promise<void> {
    // ギルドチャンネルが設定されているギルドとそのドメインを取得
    const guildsToNotify = this.db.prepare(`
      SELECT 
        gc.guild_id,
        gc.channel_id,
        gd.domain_id,
        d.domain as domain_name,
        d.did
      FROM guild_channels gc
      JOIN guild_domains gd ON gc.guild_id = gd.guild_id
      JOIN domains d ON gd.domain_id = d.id
      WHERE d.available = true 
      AND gd.notified = false
    `).all() as {
      guild_id: string;
      channel_id: string;
      domain_id: number;
      domain_name: string;
      did: string;
    }[];

    for (const guild of guildsToNotify) {
      try {
        // 通知メッセージを送信
        const notificationContent = this.createMessage(guild.domain_name, guild.did);
        const result = await this.sendNotification(notificationContent, guild.channel_id);

        if (result.success) {
          // 通知成功時にguild_domainsを更新
          this.db.prepare(`
            UPDATE guild_domains 
            SET 
              notified = 1,
              notified_at = datetime('now')
            WHERE guild_id = ? AND domain_id = ?
          `).run(guild.guild_id, guild.domain_id);
        } else {
          console.error(`Failed to send notification to Guild ID: ${guild.guild_id}, Error: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error occurred during process. Guild ID: ${guild.guild_id}`, error);
      }
    }
  }
}
