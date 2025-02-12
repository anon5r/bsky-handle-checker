import { type Database } from 'better-sqlite3';

export const up = async (db: Database): Promise<void> => {
  // Split the statements to execute them separately
  const statements = [
    `CREATE TABLE domains (
      id INTEGER PRIMARY KEY,
      domain TEXT UNIQUE NOT NULL,
      is_checked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      found_at TIMESTAMP,
      last_checked_at TIMESTAMP
    )`,
    `CREATE TABLE guild_domains (
      guild_id TEXT NOT NULL,
      domain_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id),
      PRIMARY KEY (guild_id, domain_id)
    )`
  ];

  for (const sql of statements) {
    db.prepare(sql).run();
  }
};

export const down = async (db: Database): Promise<void> => {
  const statements = [
    'DROP TABLE IF EXISTS guild_domains',
    'DROP TABLE IF EXISTS domains'
  ];

  for (const sql of statements) {
    db.prepare(sql).run();
  }
};
