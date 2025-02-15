import { Database, Statement } from 'better-sqlite3';
import psl from "psl";
import { db } from '../../database';

interface Domain {
  id: number;
  domain: string;
}

interface DomainId {
  id: number;
}

interface DomainResult {
  domain: string;
}

export async function loadDomains(guildId: string): Promise<string[]> {
  const stmt = db.prepare(`
    SELECT d.domain 
    FROM domains d
    JOIN guild_domains gd ON d.id = gd.domain_id
    WHERE gd.guild_id = ?
  `) as Statement<[string], DomainResult>;

  const domains = stmt.all(guildId);
  return domains.map(row => row.domain);
}


export async function addDomain(guildId: string, domain: string): Promise<void> {
  db.transaction(() => {
    const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO domains (domain)
        VALUES (?)
        RETURNING id
    `) as Statement<[string], DomainId>;

    const selectStmt = db.prepare(
      'SELECT id FROM domains WHERE domain = ?'
    ) as Statement<[string], DomainId>;

    const result = insertStmt.get(domain);
    const domainId = result?.id ?? selectStmt.get(domain)?.id;

    const linkStmt = db.prepare(`
        INSERT OR IGNORE INTO guild_domains (guild_id, domain_id)
        VALUES (?, ?)
    `) as Statement<[string, number], void>;

    linkStmt.run(guildId, domainId as number);
  })();
}

export async function removeDomain(guildId: string, domain: string): Promise<void> {
  db.transaction(() => {
    const selectStmt = db.prepare(
      'SELECT id FROM domains WHERE domain = ?'
    ) as Statement<[string], DomainId>;

    const domainRecord = selectStmt.get(domain);

    if (domainRecord) {
      const unlinkStmt = db.prepare(`
        DELETE FROM guild_domains 
        WHERE guild_id = ? AND domain_id = ?
      `) as Statement<[string, number], void>;
      unlinkStmt.run(guildId, domainRecord.id);

      const checkUsageStmt = db.prepare(
        'SELECT 1 FROM guild_domains WHERE domain_id = ?'
      ) as Statement<[number], { 1: number } | undefined>;
      const isUsed = checkUsageStmt.get(domainRecord.id);

      if (!isUsed) {
        const deleteStmt = db.prepare(
          'DELETE FROM domains WHERE id = ?'
        ) as Statement<[number], void>;
        deleteStmt.run(domainRecord.id);
      }
    }
  })();
}


export function isValidFQDN(domain: string): boolean {
  const fqdnRegex = /^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.)+[a-z]{2,})$/i;
  if (!fqdnRegex.test(domain)) {
    return false;
  }

  const parsed = psl.parse(domain);
  if ('error' in parsed) {
    return false;
  }
  return parsed.tld !== null && parsed.domain !== null;
}
