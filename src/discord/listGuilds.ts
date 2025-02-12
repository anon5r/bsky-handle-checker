import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { Client, GatewayIntentBits } from 'discord.js';

async function main() {
  // Botトークンを環境変数から読み込み
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('環境変数 DISCORD_BOT_TOKEN が設定されていません。');
    process.exit(1);
  }

  // クライアントを作成
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,  // Guildに関する情報を扱うIntent
    ],
  });

  // ログイン
  await client.login(token);

  // ready イベントが来るまで待つ
  client.once('ready', () => {
    console.log(`ログインしました: ${client.user?.tag}`);
    // BotがキャッシュしているGuildの一覧を取得
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.log('参加しているサーバーはありません。');
    } else {
      console.log('参加中のサーバー一覧:');
      guilds.forEach(guild => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
      });
    }
    // 処理が終わったのでプロセス終了
    process.exit(0);
  });
}

// スクリプト実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
