import * as fs from 'fs/promises';
import path from 'path';
import psl from "psl";

/**
 * Guildごとの domains.json のパスを生成
 */
function getGuildDomainsPath(guildId: string): string {
  return path.join(__dirname, '../../../data/guilds', guildId, 'domains.json');
}

/**
 * ドメイン一覧を読み込む
 * @param guildId
 */
export async function loadDomains(guildId: string): Promise<string[]> {
  const filePath = getGuildDomainsPath(guildId);
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await saveDomains(guildId, []);
      return [];
    }
    throw error;
  }
}

/**
 * ドメイン一覧を保存する
 * @param guildId
 * @param domains
 */
export async function saveDomains(guildId: string, domains: string[]): Promise<void> {
  const filePath = getGuildDomainsPath(guildId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(domains, null, 2), 'utf-8');
}


// コマンドハンドラー関数群
/**
 * ドメインFQDNの検証
 * @param domain
 */
export function isValidFQDN(domain: string): boolean {
  // 基本的なFQDN形式チェック
  const fqdnRegex = /^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.)+[a-z]{2,})$/i;
  if (!fqdnRegex.test(domain)) {
    return false;
  }

  // PSLを使用したドメイン検証
  const parsed = psl.parse(domain);
  if ('error' in parsed) {
    return false;
  }
  return parsed.tld !== null && parsed.domain !== null;
}
