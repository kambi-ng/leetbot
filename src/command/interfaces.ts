import type { TextChannel } from 'discord.js';
import { ReacordDiscordJs } from "reacord"

export interface Meta {
  isMod: boolean | undefined,
  fromGuild: boolean,
  channel?: TextChannel,
  command?: string,
  commandArgs?: string[],
  reacord: ReacordDiscordJs
}
