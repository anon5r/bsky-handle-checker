import axios from 'axios';
import fs from 'fs-extra';

// チェックするドメイン一覧
const domains = [
  "activisionblizzard.com",
  "atlus.co.jp",
  "atlus.com",
  "bandainamcoent.co.jp",
  "bandainamcoent.com",
  "battle.net",
  "bethesda.net",
  "capcom.co.jp",
  "capcom.com",
  "cdprojektred.com",
  "counter-strike.net",
  "dota2.com",
  "ea.com",
  "epicgames.com",
  "finalfantasyxiv.com",
  "koeitecmo.co.jp",
  "koeitecmo.com",
  "konami.co.jp",
  "konami.com",
  "leagueoflegends.com",
  "level5.co.jp",
  "minecraft.net",
  "nexon.com",
  "nintendo.co.jp",
  "nintendo.com",
  "playhearthstone.com",
  "playonline.com",
  "playoverwatch.com",
  "playstation.com",
  "playvalorant.com",
  "pokemon.co.jp",
  "pubg.com",
  "riotgames.com",
  "sega.co.jp",
  "sega.com",
  "square-enix.com",
  "streetfighter.com",
  "take2games.com",
  "tekken-official.jp",
  "ubisoft.com",
  "worldofwarcraft.com",
  "xbox.com",
];

// Discord WebhookのURL
const discordWebhookUrl = 'https://discord.com/api/webhooks/1310564989953638480/mg04OHMf-QYcc09vZBVqWY2MRjWkMWORUwzyiGHaYrcJBziXdFfTXge_sEzbYMDUBMYR';
const checkedDomainsFile = './checkedDomains.json';

// チェック済みドメインリストを読み込む
async function loadCheckedDomains(): Promise<Set<string>> {
  if (await fs.pathExists(checkedDomainsFile)) {
    const data = await fs.readJSON(checkedDomainsFile);
    return new Set(data);
  }
  return new Set();
}

// チェック済みドメインリストを保存する
async function saveCheckedDomains(checkedDomains: Set<string>) {
  await fs.writeJSON(checkedDomainsFile, Array.from(checkedDomains), { spaces: 2 });
}

// Discord通知
async function notifyDiscord(message: string) {
  try {
    await axios.post(discordWebhookUrl, { content: message });
    console.log('Discordに通知を送信しました:', message);
  } catch (error) {
    console.error('Discordへの通知送信中にエラーが発生しました:', error);
  }
}

// ハンドルをチェックする
async function checkHandles() {
  const checkedDomains = await loadCheckedDomains();

  for (const domain of domains) {
    if (checkedDomains.has(domain)) {
      console.log(`スキップ済みドメイン: ${domain}`);
      continue;
    }

    const handle = domain
    const url = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`;
    // console.info(url)
    try {
      const response = await axios.get(url);

      if (response.data?.did) {
        console.log(`ハンドルが検出されました: ${handle}`);
        await notifyDiscord(`ハンドルが検出されました: ${handle} \nDID: ${response.data.did}`);
        checkedDomains.add(domain); // チェック済みとして登録
        await saveCheckedDomains(checkedDomains);
      } else {
        console.log(`ハンドルが検出されませんでした: ${handle}`);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data.message === 'Unable to resolve handle') {
          console.log(`ハンドルが検出されませんでした: ${handle}`);
        } else {
          console.error(`APIエラー <${domain}>: ${error.message}`, error.response?.data);
        }
      } else {
        console.error(`予期しないエラー <${domain}>: ${String(error)}`);
      }
    }
  }
}

// 実行
checkHandles();
