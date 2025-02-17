import { table } from 'table';
import Database from 'better-sqlite3';
import path from 'path';

interface Domain {
  id: number;
  domain: string;
  available: boolean;
  found_at: string;
  created_at: string;
  last_checked_at: string;
}

/**
 * ドメインの統計情報を表示する
 */
const domainsStats = () => {
  const db = new Database(path.join(process.cwd(), 'data/database.sqlite'));
  const totalDomainsCount = db.prepare('SELECT COUNT(1) as total FROM domains').get() as { total: number };
  const availableDomainsCount = db.prepare('SELECT COUNT(1) as total FROM domains WHERE available = 1').get() as { total: number };
  console.log(`Total: ${totalDomainsCount.total.toLocaleString()}, Found: ${availableDomainsCount.total.toLocaleString()}, NotFound: ${totalDomainsCount.total - availableDomainsCount.total} (${((availableDomainsCount.total / totalDomainsCount.total) * 100).toPrecision(2)}%)`);
  db.close();
}

/**
 * ドメインをリスト表示する
 * @param filterAvailable
 */
const listDomains = (filterAvailable?: boolean) => {
  const db = new Database(path.join(process.cwd(), 'data/database.sqlite'));

  let query = 'SELECT * FROM domains';
  if (filterAvailable !== undefined) {
    query += ' WHERE available = ?';
  }

  const domains = db.prepare(query).all(filterAvailable !== undefined ? [filterAvailable ? 1 : 0] : []) as Domain[];

  const headers = ['ID', 'ドメイン名', 'Bluesky', '登録成日', '見つかった日', '最終確認日'];
  const rows = domains.map(domain => [
    domain.id,
    domain.domain,
    domain.available ? '○' : '×',
    domain.created_at,
    domain.found_at,
    domain.last_checked_at
  ]);

  const data = [headers, ...rows];
  console.log(table(data));
  console.log('='.repeat(60));
  console.log(`Total: ${rows.length} rows`)

  db.close();
};

// コマンドライン引数の処理
const args = process.argv.slice(2);
let filterAvailable: boolean | undefined;

if (args.length === 0) {
  // ドメインの統計情報を表示する
  domainsStats();
}

if (args.includes('--list')) {
  if (args.includes('--available')) {
    filterAvailable = true;
  } else if (args.includes('--unavailable')) {
    filterAvailable = false;
  }
  // ドメインをリスト表示する
  listDomains(filterAvailable);
}
