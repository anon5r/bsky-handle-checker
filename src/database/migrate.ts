import { migrator } from './umzug';

async function runMigrations() {
  try {
    await migrator.up();
    console.log('✅ DB migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error :', error);
    process.stderr.write(`DB migration failed: ${error}\n`);
    process.exit(1);
  }
}

runMigrations().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Migration error:', error);
  process.stderr.write(`DB migration failed: ${error}\n`);
  process.exit(1);
});
