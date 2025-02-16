import { Database } from 'better-sqlite3';

export const up = async (db: Database): Promise<void> => {
  db.exec(`
    ALTER TABLE domains RENAME COLUMN is_checked TO available;
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.exec(`
    ALTER TABLE domains RENAME COLUMN available TO is_checked;
  `);
};
