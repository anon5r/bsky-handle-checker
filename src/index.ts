import { CrawlService } from './services/crawlService';
import 'dotenv/config';

async function main() {
  const guildId = process.argv[2]?.trim() ?? null;

  console.log(`[${(new Date).toLocaleString()}] START Crawler`);
  const crawlService = new CrawlService();

  try {

    // Fetch target domains
    const domains = await crawlService.getDomains(guildId ?? undefined);
    if (domains.length === 0) {
      console.log('No domains found to check.');
      return;
    }

    // Start crawling
    await crawlService.processDomainsCheck(domains);

    console.log('Process completed successfully.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    crawlService.close();
    console.log(`[${(new Date).toLocaleString()}] DONE Crawler`);
  }
}


main().catch(console.error);
