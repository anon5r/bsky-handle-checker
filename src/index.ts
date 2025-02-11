import axios from 'axios';
import fs from 'fs-extra';

// JSON file path for the domain list
const domainsFilePath = './data/domains.json';
const checkedDomainsFile = './data/checkedDomains.json';

// Load the domain list from the JSON file
async function loadDomains(): Promise<string[]> {
  try {
    if (!await fs.pathExists(domainsFilePath))
      await fs.outputJSON(domainsFilePath, []);
    return await fs.readJSON(domainsFilePath);
  } catch (error) {
    console.error("An error occurred while loading the domain list:", error);
    return [];
  }
}

// Get the Discord Webhook URL from environment variables or set a default value
const discordWebhookUrl :string|null = process.env.DISCORD_WEBHOOK_URL || null;

// Load the checked domain list
async function loadCheckedDomains(): Promise<Set<string>> {
  if (await fs.pathExists(checkedDomainsFile)) {
    const data = await fs.readJSON(checkedDomainsFile);
    return new Set(data);
  }
  return new Set();
}

// Save the checked domain list
async function saveCheckedDomains(checkedDomains: Set<string>) {
  await fs.writeJSON(checkedDomainsFile, Array.from(checkedDomains), { spaces: 2 });
}

// Send a Discord notification
async function notifyDiscord(message: string) {
  if (discordWebhookUrl === null)
    return;
  try {
    await axios.post(discordWebhookUrl, { content: message });
    console.log('Sent a notification to Discord:', message);
  } catch (error) {
    console.error('An error occurred while sending a notification to Discord:', error);
  }
}


// Sleep function
function sleep(ms: number): Promise<void> {
  console.log(`Pausing for ${(ms/1000).toPrecision(1)} seconds...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check handles
async function checkHandles() {
  const domains = await loadDomains();
  const checkedDomains = await loadCheckedDomains();

  let count = 0;
  for (const domain of domains) {
    if (checkedDomains.has(domain)) {
      console.log(`Skipped domain: ${domain}`);
      continue;
    }

    requestHandle(checkedDomains, domain)
    count++;
    if (count % 20 === 0)
      await sleep(3000);
  }
}

async function requestHandle(checkedDomains: Set<string>, handle: string) {

  const url = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`;

  try {
    const response = await axios.get(url);

    if (response.data?.did) {
      console.log(`Handle detected: ${handle}`);
      await notifyDiscord(`Handle detected: **${handle}**\n`
        + `DID: \`${response.data.did}\`\n`
        + `https://bsky.app/profile/${handle}`);
      checkedDomains.add(handle);
      await saveCheckedDomains(checkedDomains);
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

// Execute
checkHandles();
