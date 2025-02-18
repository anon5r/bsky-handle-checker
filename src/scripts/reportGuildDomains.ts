import 'dotenv/config';
import { Client, GatewayIntentBits, Guild } from 'discord.js';
import Database from 'better-sqlite3';
import path from 'path';
import { table } from 'table';

interface GuildDomainReport {
  guildId: string;
  guildName: string;
  totalDomains: number;
  unavailableDomains: number;
  ratio: string; // "xx.xx%" 形式
}

async function main() {
  // Discordクライアントの準備
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  // SQLiteデータベースの準備
  const db = new Database(path.join(process.cwd(), 'data', 'database.sqlite'));

  // ログイン完了待機
  await client.login(process.env.DISCORD_BOT_TOKEN);

  // ギルド一覧を取得 (キャッシュから取得)
  // キャッシュに存在しない場合は fetch() で取得できますが、
  // Botが所属している通常のギルドであればcacheに存在するはずです。
  const guildReports: GuildDomainReport[] = [];

  for (const [guildId, guild] of client.guilds.cache) {
    const guildData: Guild = await guild.fetch(); // 念のためfetch

    // guild_domains と domains をJOINして数を集計
    // unavailableDomains = domains.availableがfalseの件数
    // totalDomains = 全体の件数
    const row = db
      .prepare(
        `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN d.available = 0 THEN 1 ELSE 0 END) AS unavailable
        FROM guild_domains gd
        JOIN domains d ON gd.domain_id = d.id
        WHERE gd.guild_id = ?
      `
      )
      .get(guildId) as { total: number; unavailable: number };

    if (!row) {
      // 該当ギルドのデータなしの場合は0で扱う
      guildReports.push({
        guildId,
        guildName: guildData.name,
        totalDomains: 0,
        unavailableDomains: 0,
        ratio: '0.00%',
      });
      continue;
    }

    const total = row.total || 0;
    const unavailable = row.unavailable || 0;
    const ratioVal = total > 0 ? (unavailable / total) * 100 : 0;
    const ratioStr = `${ratioVal.toFixed(2)}%`;

    guildReports.push({
      guildId,
      guildName: guildData.name,
      totalDomains: total,
      unavailableDomains: unavailable,
      ratio: ratioStr,
    });
  }

  // tableパッケージを用いて表示
  // ヘッダ行を定義
  const header = ['Guild ID', 'サーバー名', '登録ドメイン数', '確認中', '未確認割合(%)'];
  const tableData = [
    header,
    ...guildReports.map(report => [
      report.guildId,
      report.guildName,
      report.totalDomains,
      report.unavailableDomains,
      report.ratio,
    ]),
  ];

  console.log(table(tableData));

  // 終了処理
  db.close();
  client.destroy();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
