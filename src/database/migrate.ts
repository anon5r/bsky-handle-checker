import { migrator } from './umzug';

async function runMigrations() {
  try {
    await migrator.up();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations().then(r => {
  console.log('Migration completed');
  process.exit(0);
});
