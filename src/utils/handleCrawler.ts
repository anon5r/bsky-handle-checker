import fs from "fs-extra";
import axios from "axios";


// Load the domain list from the JSON file
async function loadDomains(filePath: string): Promise<string[]> {
  try {
    if (!await fs.pathExists(filePath))
      await fs.outputJSON(filePath, []);
    return await fs.readJSON(filePath);
  } catch (error) {
    console.error("An error occurred while loading the domain list:", error);
    return [];
  }
}


async function loadCheckedDomains(filePath: string): Promise<Set<string>> {
  if (await fs.pathExists(filePath)) {
    const data = await fs.readJSON(filePath);
    return new Set(data);
  }
  return new Set();
}

// Save the checked domain list
async function saveCheckedDomains(checkedDomains: Set<string>, checkedDomainsFile: string) {
  await fs.writeJSON(checkedDomainsFile, Array.from(checkedDomains), { spaces: 2 });
}


// Sleep function
function sleep(ms: number): Promise<void> {
  console.log(`Pausing for ${(ms/1000).toPrecision(1)} seconds...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Discord通知関数
 * @param message 送信するメッセージ
 * @param webhookUrl Webhook URL (nullの場合は送信しない)
 */
async function notifyDiscord(message: string, webhookUrl: string | null) {
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, { content: message });
    console.log('Sent a notification to Discord:', message);
  } catch (error) {
    console.error('An error occurred while sending a notification to Discord:', error);
  }
}

/**
 * ハンドル (ドメイン) を1件チェックして必要に応じて通知する
 * @param checkedDomains
 * @param checkedDomainsFile
 * @param handle
 * @param webhookUrl
 */
async function requestHandle(
  checkedDomains: Set<string>,
  checkedDomainsFile: string,
  handle: string,
  webhookUrl: string | null
) {
  const url = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`;

  try {
    const response = await axios.get(url);
    if (response.data?.did) {
      console.log(`Handle detected: ${handle}`);
      await notifyDiscord(
        `Handle detected: **${handle}**\n` +
        `DID: \`${response.data.did}\`\n` +
        `https://bsky.app/profile/${handle}`,
        webhookUrl
      );
      checkedDomains.add(handle);
      await saveCheckedDomains(checkedDomains, checkedDomainsFile);
    } else {
      console.log(`Handle not found: ${handle}`);
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data.message === 'Unable to resolve handle') {
        console.log(`Handle not found: ${handle}`);
      } else {
        console.error(`API error <${handle}>: ${error.message}`, error.response?.data);
      }
    } else {
      console.error(`An unexpected error occurred <${handle}>: ${String(error)}`);
    }
  }
}


/**
 * メインの一括チェック関数 (index.tsから呼び出し可能)
 * @param domainsFilePath ドメイン一覧ファイル
 * @param checkedDomainsFilePath チェック済みファイル
 * @param webhookUrl DiscordのWebhook URL (nullなら通知しない)
 */
export async function checkHandles(
  domainsFilePath: string,
  checkedDomainsFilePath: string,
  webhookUrl: string | null
): Promise<void> {
  const domains = await loadDomains(domainsFilePath);
  const checkedDomains = await loadCheckedDomains(checkedDomainsFilePath);

  let count = 0;
  for (const domain of domains) {
    if (checkedDomains.has(domain)) {
      console.log(`Skipped domain: ${domain}`);
      continue;
    }

    // 未チェックのドメインをチェックする
    await requestHandle(checkedDomains, checkedDomainsFilePath, domain, webhookUrl);

    // ある程度処理したら一旦スリープする (例: 20件ごと)
    count++;
    if (count % 20 === 0) {
      await sleep(3000);
    }
  }
  console.log('All domain checks completed.');
}

