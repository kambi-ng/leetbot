import { Question } from "../../gql/client";
import { fetchDaily } from "../../gql/endpoints";
import { Guild } from "discord.js";

export default async function sendToday(guild: Guild) {
  const res: Question = await (await fetchDaily()).data;
  // TODO: send message
}
