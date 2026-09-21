import commandRegistry from '../lib/commandRegistry.js';
import { aiCommands } from './ai/index.js';
import { mediaCommands } from './media/index.js';
import { groupCommands } from './group/index.js';
import { moderationCommands } from './moderation/index.js';
import { productivityCommands } from './productivity/index.js';
import { ownerCommands } from './owner/index.js';
import { gamesCommands } from './games/index.js';
import { infoCommands } from './info/index.js';
import { statusCommands } from './status/index.js';
import logger from '../lib/logger.js';

export function registerAllCommands(): void {
  const allGroups = [
    aiCommands,
    mediaCommands,
    groupCommands,
    moderationCommands,
    productivityCommands,
    ownerCommands,
    gamesCommands,
    infoCommands,
    statusCommands,
  ];

  let count = 0;
  for (const group of allGroups) {
    for (const cmd of group) {
      commandRegistry.register(cmd);
      count++;
    }
  }

  logger.info(`Loaded ${count} commands across all categories`);
}

export default registerAllCommands;
