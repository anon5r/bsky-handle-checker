import { Database } from 'better-sqlite3';

export const up = async (db: Database): Promise<void> => {
  db.exec(`
    ALTER TABLE guild_domains ADD COLUMN notified INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE guild_domains ADD COLUMN notified_at TIMESTAMP DEFAULT NULL;
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.exec(`
    ALTER TABLE guild_domains DROP COLUMN notified;
    ALTER TABLE guild_domains DROP COLUMN notified_at;
  `);
};
