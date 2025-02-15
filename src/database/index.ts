import Database from 'better-sqlite3';
import path from 'path';

// データベース接続の初期化
export const db = new Database(path.join(__dirname, '../../data/database.sqlite'));

// データベースの設定
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
