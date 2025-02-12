import { addDomainCommand, runAddDomain } from './addDomain';
import { removeDomainCommand, runRemoveDomain } from './removeDomain';
import { listDomainsCommand, runListDomains } from './listDomains';
import { connectChannelCommand, runConnectChannel } from "./connectChannel";
import { disconnectChannelCommand, runDisconnectChannel } from "./disconnectChannel";
// 他のコマンドが増えたらここにimport追加

export const commandDefs = [
  addDomainCommand,
  removeDomainCommand,
  listDomainsCommand,
  connectChannelCommand,
  disconnectChannelCommand
];

/**
 * コマンド名と実行関数の対応表
 */
export const commandHandlers = {
  'add-domain': runAddDomain,
  'remove-domain': runRemoveDomain,
  'list-domains': runListDomains,
  'connect-channel': runConnectChannel,
  'disconnect-channel': runDisconnectChannel,
};
