import fs from 'fs/promises';
import path from 'path';
import { db } from '../database';
import {Statement} from "better-sqlite3";

async function importDomainsFromJson() {
  const guildsDir = path.join(__dirname, '../../data/guilds');

  try {
    const guildDirs = await fs.readdir(guildsDir);

    for (const guildId of guildDirs) {
      const domainsPath = path.join(guildsDir, guildId, 'domains.json');

      try {
        const domainsData = await fs.readFile(domainsPath, 'utf-8');
        const domains = JSON.parse(domainsData);

        db.transaction(() => {
          for (const domain of domains) {
            // domainsテーブルにドメインを登録
            const insertStmt = db.prepare(`
              INSERT OR IGNORE INTO domains (domain)
              VALUES (?)
              RETURNING id
            `);
            const result = insertStmt.get(domain) as { id?: number } | undefined;

            // 既存のドメインの場合はIDを取得
            const domainId = result?.id ?? (db.prepare(
              'SELECT id FROM domains WHERE domain = ?'
            ).get(domain) as { id: number }).id;

            // guild_domainsテーブルに関連付けを登録
            db.prepare(`
              INSERT OR IGNORE INTO guild_domains (guild_id, domain_id)
              VALUES (?, ?)
            `).run(guildId, domainId);
          }
        })();

        console.log(`✔ Imported domains for guild ${guildId}`);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.error(`❌ Error importing domains for guild ${guildId}:`, err);
        }
      }
    }
    console.log('✅ Domain import completed');
  } catch (err) {
    console.error('❌ Failed to read guilds directory:', err);
    process.exit(1);
  }
}

importDomainsFromJson();
