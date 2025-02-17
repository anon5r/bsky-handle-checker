import {Client, Colors, EmbedBuilder, GatewayIntentBits, TextChannel, BaseGuildTextChannel} from 'discord.js';
import Database from 'better-sqlite3';
import path from 'path';
import {isChannelPublic} from "../discord/utils/channelConfig";

interface NotificationResult {
  success: boolean;
  error?: string;
}

interface NotifyDomainRecords {
  guild_id: string;
  channel_id: string;
  domain_id: number;
  domain_name: string;
  did: string;
  found_at: string,
}

export class NotificationService {
  private client: Client;
  private db: Database.Database;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ]
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

      if (channel === null || !channel.isTextBased()) {
        throw new Error('Invalid channel or channel type');
      }
      if ("guild" in channel) {
        const guildChannel = channel as TextChannel;
        if (!await isChannelPublic(guildChannel)) {
          throw new Error('Channel is not public');
        }

        if (!('send' in channel)) {
          throw new Error('Channel does not support sending messages');
        }

        if (content instanceof EmbedBuilder) {
          await channel.send({embeds: [content]});
        } else {
          await channel.send(content);
        }
        return {success: true};
      } else {
        return {success: false};
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private createMessage(records: NotifyDomainRecords): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(`@${records.domain_name}`)
      .setDescription(`Monitored custom handle has been detected on Bluesky.`)
      .setURL(`https://bsky.app/profile/${records.domain_name}`)
      .setTimestamp()
      .addFields(
        {name: 'Handle', value: `\`@${records.domain_name}\``},
        {name: 'DID', value: `\`${records.did}\``}
      )
      .addFields({name: 'Profile page', value: `https://bsky.app/profile/${records.domain_name}`})
      .setFooter({text: `${records.domain_name} on Bluesky`, iconURL: 'https://web-cdn.bsky.app/static/favicon-32x32.png'})
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
        d.did,
        d.found_at
      FROM guild_channels gc
      JOIN guild_domains gd ON gc.guild_id = gd.guild_id
      JOIN domains d ON gd.domain_id = d.id
      WHERE d.available = true 
      AND gd.notified = false
    `).all() as NotifyDomainRecords[];

    for (const record of guildsToNotify) {
      try {
        // 通知内容を作成
        const notificationContent = this.createMessage(record);

        // 通知メッセージを送信
        const result = await this.sendNotification(notificationContent, record.channel_id);

        if (result.success) {
          // 通知成功時にguild_domainsを更新
          this.db.prepare(`
            UPDATE guild_domains 
            SET 
              notified = 1,
              notified_at = datetime('now')
            WHERE guild_id = ? AND domain_id = ?
          `).run(record.guild_id, record.domain_id);
        } else {
          console.error(`Failed to send notification to {Guild: ${record.guild_id}, Channel: ${record.channel_id}}, Error: "${result.error}"`);
        }
      } catch (error) {
        console.error(`Error occurred during process. {Guild: ${record.guild_id}, Channel: ${record.channel_id}}`, error);
      }
    }
  }
}
