import { migrator } from './umzug';

async function runMigrations() {
  try {
    await migrator.up();
    console.log('✅ マイグレーション完了');
  } catch (error) {
    console.error('❌ マイグレーション失敗:', error);
    process.stderr.write(`マイグレーション失敗: ${error}\n`);
    process.exit(1);
  }
}

runMigrations().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ マイグレーション実行エラー:', error);
  process.stderr.write(`マイグレーション実行エラー: ${error}\n`);
  process.exit(1);
});
