import { Database } from 'better-sqlite3';

export const up = async (db: Database): Promise<void> => {
  db.exec(`
    ALTER TABLE domains ADD COLUMN did TEXT;
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.exec(`
    ALTER TABLE domains DROP COLUMN did;
  `);
};
