import { NotificationService } from './services/notificationService';
import 'dotenv/config';

async function main() {
  const guildId = process.argv[2]?.trim() ?? null;
  const notificationService = new NotificationService();

  try {
    // 初期化
    await notificationService.initialize();
    // 利用可能なドメインの通知を各ギルドのチャンネルに送信
    await notificationService.notifyDomainAvailability();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await notificationService.close();
  }
}
main().catch(console.error);
