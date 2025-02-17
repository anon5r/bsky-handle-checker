import Database from 'better-sqlite3';
import path from 'path';
import axios from "axios";

interface CrawlResult {
  domain: string;
  available: boolean;
  did?: string;
  error?: string;
}

export class CrawlService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.join(process.cwd(), 'data', 'database.sqlite'), {
      verbose: (process.env.DEBUG === 'true' ? console.log : undefined)
    });
  }

  async getDomains(guildId?: string): Promise<string[]> {
    let domains: { domain: string }[];

    if (guildId) {
      domains = this.db.prepare(`
          SELECT DISTINCT domain
          FROM domains AS d
          INNER JOIN guild_domains AS g ON (d.id = g.domain_id)
          WHERE d.available = 0
          AND g.guild_id = ?
      `).all(guildId) as { domain: string }[];
    } else {
      domains = this.db.prepare(`
          SELECT DISTINCT domain
          FROM domains
          WHERE available = 0
      `).all() as { domain: string }[];
    }

    return domains.map(d => d.domain);
  }

  async processDomainsCheck(domains: string[]): Promise<CrawlResult[]> {
    let crawlResults: CrawlResult[] = [];
    const chunkSize = 20;
    for (let i = 0; i < domains.length; i += chunkSize) {
      const chunk = domains.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(domain => this.checkDomainAvailability(domain))
      );
      crawlResults.push(...chunkResults);
      await this.saveResults(chunkResults);

      // 次のチャンクの前に待機（最後のチャンク以外）
      if (i + chunkSize < domains.length) {
        await this.sleep(3000);
      }
    }
    if (crawlResults.length > 0)
      await this.saveResults(crawlResults);

    return crawlResults;
  }

  /**
   * ハンドル (ドメイン) を1件チェックして必要に応じて通知する
   * @param domain
   */
  async checkDomainAvailability(domain: string): Promise<CrawlResult> {
    const url = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${domain}`;
    try {
      const response = await axios.get(url);
      return {
        domain: domain,
        available: !!response.data?.did,
        did: response.data?.did
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data.message === 'Unable to resolve handle') {
          console.log(`Handle not found: ${domain}`);
          return {
            domain: domain,
            available: false,
          };
        } else {
          console.error(`API error <${domain}>: ${error.message}`, error.response?.data);
        }
      } else {
        console.error(`An unexpected error occurred <${domain}>: ${String(error)}`);
      }
      return {
        domain: domain,
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 結果を保存する
   * @param results
   */
  async saveResults(results: CrawlResult[]): Promise<void> {
    if (results.length === 0) {
      return;
    }
    const update = this.db.prepare(`
      UPDATE domains SET available = ?, found_at = ?, 
                         last_checked_at = CURRENT_TIMESTAMP, did = ?
      WHERE domain = ?
    `);

    this.db.transaction(() => {
      for (const result of results) {
        if (result.error) {
          console.error(`Error checking domain ${result.domain}: ${result.error}`);
          continue;
        }
        update.run(
          (result.available ? 1 : 0),
          (result.available ? (new Date).toLocaleString('sv-SE',{timeZone: 'UTC'}) : null),
          result.did,
          // WHERE clause
          result.domain
        );
      }
    })();
  }

  sleep(ms: number): Promise<void> {
    console.log(`Pausing for ${(ms/1000).toPrecision(1)} seconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  close(): void {
    this.db.close();
  }
}
