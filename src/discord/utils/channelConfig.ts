import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * connectChannel.json のファイルパスを返す
 * @param guildId 対象ギルドID
 */
function getConnectChannelFilePath(guildId: string): string {
  return path.join(__dirname, '../../../data/guilds', guildId, 'connectChannel.json');
}

/**
 * ギルド用のチャンネルが特定のチャンネルIDで登録済みかどうかを返す
 * @param guildId 対象ギルドID
 * @param channelId 確認したいチャンネルID
 * @returns 登録されていれば true、そうでなければ false
 */
export async function isConnectChannelRegistered(guildId: string, channelId: string): Promise<boolean> {
  const filePath = getConnectChannelFilePath(guildId);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(raw);
    return json.channelId === channelId;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

/**
 * ギルド用のチャンネル設定を保存する
 * 重複登録が起きないよう、既に同じチャンネルIDで登録済みの場合は何もしない
 * @param guildId 対象ギルドID
 * @param channelId 設定するチャンネルID
 */
export async function saveConnectChannel(guildId: string, channelId: string) {
  if (await isConnectChannelRegistered(guildId, channelId)) {
    return;
  }

  const filePath = getConnectChannelFilePath(guildId);
  const data = { channelId };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * チャンネルIDのキーだけを削除する
 * @param guildId 対象ギルドID
 */
export async function clearConnectChannel(guildId: string) {
  const filePath = getConnectChannelFilePath(guildId);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    delete data.channelId;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return;
    }
    throw err;
  }
}

/**
 * ギルド用のチャンネル設定を削除する（ファイルを削除する）
 * @param guildId 対象ギルドID
 */
export async function deleteConnectChannel(guildId: string) {
  const filePath = getConnectChannelFilePath(guildId);
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return;
    }
    throw err;
  }
}

/**
 * 設定ファイルを読み込んで channelId を返す
 * @param guildId 対象ギルドID
 * @returns channelId が存在すればその値、存在しなければ null
 */
export async function getConnectChannelId(guildId: string): Promise<string | null> {
  const filePath = getConnectChannelFilePath(guildId);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.channelId ?? null;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}
