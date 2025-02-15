import { ChatInputCommandInteraction } from 'discord.js';
import { addDomainCommand, runAddDomain } from './addDomain';
import { removeDomainCommand, runRemoveDomain } from './removeDomain';
import { listDomainsCommand, runListDomains } from './listDomains';
import { channelCommand, runChannelCommand } from "./channel";
// 他のコマンドが増えたらここにimport追加

export const commandDefs = [
  addDomainCommand,
  removeDomainCommand,
  listDomainsCommand,
  channelCommand,
];

/**
 * コマンド名と実行関数の対応表
 */

export const commandHandlers = {
  'add-domain': async (interaction: ChatInputCommandInteraction) => {
    try {
      await runAddDomain(interaction);
    } catch (error) {
      console.error('❌ add-domain実行エラー:', error);
      process.stderr.write(`add-domain実行エラー: ${error}\n`);
      throw error;
    }
  },
  'remove-domain': async (interaction: ChatInputCommandInteraction) => {
    try {
      await runRemoveDomain(interaction);
    } catch (error) {
      console.error('❌ remove-domain実行エラー:', error);
      process.stderr.write(`remove-domain実行エラー: ${error}\n`);
      throw error;
    }
  },
  'list-domains': async (interaction: ChatInputCommandInteraction) => {
    try {
      await runListDomains(interaction);
    } catch (error) {
      console.error('❌ list-domains実行エラー:', error);
      process.stderr.write(`list-domains実行エラー: ${error}\n`);
      throw error;
    }
  },
  'channel': async (interaction: ChatInputCommandInteraction) => {
    try {
      await runChannelCommand(interaction);
    } catch (error) {
      console.error('❌ channel実行エラー:', error);
      process.stderr.write(`channel実行エラー: ${error}\n`);
      throw error;
    }
  },
};
