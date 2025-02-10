import * as fs from 'fs';
import * as path from 'path';

const jsonFilePath = path.join(__dirname, '../../data/domains.json');

// JSONファイルを読み取る関数
export const readDomains = (): string[] => {
  try {
    const data = fs.readFileSync(jsonFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read JSON file:', error);
    return [];
  }
};

// JSONファイルに書き込む関数
export const writeDomains = (domains: string[]): void => {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(domains, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write JSON file:', error);
  }
};
