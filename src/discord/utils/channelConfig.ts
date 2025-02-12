import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * ギルド用のチャンネル設定を保存する
 * @param guildId 対象ギルドID
 * @param channelId 設定するチャンネルID
 */
export async function saveConnectChannel(guildId: string, channelId: string) {
  const filePath = path.join(__dirname, '../../../data/guilds', guildId, 'connectChannel.json');
  const data = { channelId };

  // ディレクトリが存在しない場合は作成
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // JSONファイルに書き込み
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * ギルド用のチャンネル設定を読み込む
 * @param guildId 対象ギルドID
 * @returns channelId or null
 */
export async function loadConnectChannel(guildId: string): Promise<string | null> {
  const filePath = path.join(__dirname, '../../data/guilds', guildId, 'connectChannel.json');
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(raw);
    return json.channelId ?? null;
  } catch (err: any) {
    // ファイル未作成などの場合は null を返す
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}
