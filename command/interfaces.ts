import type { TextChannel } from 'discord.js';

export interface Meta {
  isMod: boolean | undefined,
  fromGuild: boolean,
  channel?: TextChannel,
  command?: string,
  commandArgs?: string[],
}
