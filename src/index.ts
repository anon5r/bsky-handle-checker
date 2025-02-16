// src/index.ts
import { CrawlService } from './services/crawlService';
import { NotificationService } from './services/notificationService';
import 'dotenv/config';

async function main() {
  const guildId = process.argv[2]?.trim() ?? null;
  const crawlService = new CrawlService();
  const notificationService = new NotificationService();

  try {
    // 初期化
    await notificationService.initialize();

    // ドメイン取得とクロール
    const domains = await crawlService.getDomains(guildId ?? undefined);
    if (domains.length === 0) {
      console.log('No domains found to check.');
      return;
    }

    // クロール実行
    const results = await crawlService.processDomainsCheck(domains);

    // 通知チャンネル取得
    const channelId = await notificationService.getChannelId(guildId ?? undefined);

    // 結果を整形して通知
    const messageContent = formatResultsMessage(results);
    const notificationResult = await notificationService.sendNotification(
      messageContent,
      channelId
    );

    if (!notificationResult.success) {
      console.error('Failed to send notification:', notificationResult.error);
    }

    console.log('Process completed successfully.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // リソースのクリーンアップ
    crawlService.close();
    await notificationService.close();
  }
}

function formatResultsMessage(results: any[]): string {
  // 結果をDiscordメッセージ形式に整形するロジック
  // ...
  return '';
}

main().catch(console.error);
