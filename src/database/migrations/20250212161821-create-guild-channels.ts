import { type Database } from 'better-sqlite3';

export const up = async (db: Database): Promise<void> => {
  db.prepare(`
    CREATE TABLE guild_channels (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
};

export const down = async (db: Database): Promise<void> => {
  db.prepare('DROP TABLE IF EXISTS guild_channels').run();
};
