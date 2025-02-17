import { Statement } from 'better-sqlite3';
import psl from "psl";
import { db } from '../../database';

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly domain?: string,
    public readonly reasonCode?: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

interface DomainId {
  id: number;
}

interface DomainResult {
  domain: string;
}

/**
 * ドメインをロードする
 * @param guildId
 */
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

/**
 * ドメインのページネーションを取得する
 * @param guildId
 * @param page
 * @param itemsPerPage
 */
export async function loadDomainsWithPagination(guildId: string, page: number, itemsPerPage: number): Promise<{ domains: string[], total: number }> {
  const offset = (page - 1) * itemsPerPage;

  const totalStmt = db.prepare(`
      SELECT COUNT(DISTINCT d.domain) as total
      FROM domains d
               JOIN guild_domains gd ON d.id = gd.domain_id
      WHERE gd.guild_id = ?
  `) as Statement<[string], { total: number }>;

  const domainsStmt = db.prepare(`
      SELECT d.domain
      FROM domains d
               JOIN guild_domains gd ON d.id = gd.domain_id
      WHERE gd.guild_id = ?
      ORDER BY d.domain
      LIMIT ? OFFSET ?
  `) as Statement<[string, number, number], DomainResult>;

  const totalResult = totalStmt.get(guildId);
  const total = totalResult ? totalResult.total : 0;
  const domains = domainsStmt.all(guildId, itemsPerPage, offset);

  return {
    domains: domains.map(row => row.domain),
    total
  };
}


/**
 * ドメインを追加する
 * @param guildId
 * @param domain
 */
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

    const linkSelectStmt = db.prepare(
      'SELECT * FROM guild_domains WHERE domain_id = ? AND guild_id = ?'
    ) as Statement<[number, string], DomainId>;
    const linkRecord = linkSelectStmt.get(domainId as number, guildId);
    if (linkRecord) {
      throw new DomainError(`Domain ${domain} already exists in guild ${guildId}`,
        domain, 'ALREADY_EXISTS');
    }
    const linkStmt = db.prepare(`
        INSERT OR IGNORE INTO guild_domains (guild_id, domain_id)
        VALUES (?, ?)
    `) as Statement<[string, number], void>;

    linkStmt.run(guildId, domainId as number);
  })();
}

/**
 * ドメインを削除する
 * @param guildId
 * @param domain
 */
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

/**
 * 有効なFQDNかどうかをチェックする
 * @param domain
 */
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
