import fs from 'fs';
import { checkHandles } from './utils/handleCrawler';

(async () => {
  // guildIdなど取得
  const guildId = process.argv[2].trim() ?? null;

  // ファイルパスを組み立てる
  let domainsFilePath: string;
  let checkedDomainsFilePath: string;
  if (guildId) {
    if (!guildId.match(/^\d+$/)) {
      console.error('Invalid guild ID format.');
      process.exit(1);
    }
    // file doesn't exist
    if (!fs.existsSync(`./data/guilds/${guildId}`)) {
      console.error('Guild data does not exist.');
      process.exit(1);
    }
    domainsFilePath = `./data/guilds/${guildId}/domains.json`;
    checkedDomainsFilePath = `./data/guilds/${guildId}/checkedDomains.json`;
  } else {
    domainsFilePath = './data/domains.json';
    checkedDomainsFilePath = './data/checkedDomains.json';
    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL is not set.');
      process.exit(1);
    }
  }

  // Webhook URLを環境変数から取得
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL ?? null;

  // 処理を実行
  try
  {
    await checkHandles(domainsFilePath, checkedDomainsFilePath, webhookUrl);
    console.log('Check completed successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
})();
