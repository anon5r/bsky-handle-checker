import { Umzug } from 'umzug';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'database.sqlite');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  // Create an empty database file
  fs.writeFileSync(dbPath, '');
  new Database(dbPath).close();
}

const db = new Database(dbPath);

interface MigrationRow {
  name: string;
}

export const migrator = new Umzug({
  migrations: {
    glob: ['migrations/*.{ts,js}', { cwd: __dirname }],
    resolve: ({ name, path, context }) => {
      const migration = require(path!);
      return {
        name: name.replace(/\.[jt]s$/, ''),
        up: async () => migration.up(context),
        down: async () => migration.down(context),
      };
    },
  },
  context: db,
  storage: {
    async executed() {
      db.prepare(`CREATE TABLE IF NOT EXISTS migrations (
                                                            name VARCHAR(255) PRIMARY KEY
          )`).run();
      const results = db.prepare('SELECT name FROM migrations').all() as MigrationRow[];
      return results.map(row => row.name);
    },
    async logMigration({ name }) {
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
    },
    async unlogMigration({ name }) {
      db.prepare('DELETE FROM migrations WHERE name = ?').run(name);
    },
  },
  logger: console,
});
