import fs from 'fs';
import path from 'path';

const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const migrationName = process.argv[2];
const fileName = `${timestamp}-${migrationName}.ts`;
const filePath = path.join(__dirname, 'migrations', fileName);

const template = `import { Database } from 'better-sqlite3';

export const up = async (db: Database): Promise<void> => {
  db.exec(\`
    -- Add your UP migration SQL here
  \`);
};

export const down = async (db: Database): Promise<void> => {
  db.exec(\`
    -- Add your DOWN migration SQL here
  \`);
};
`;

fs.writeFileSync(filePath, template);
console.log(`Created migration: ${fileName}`);
