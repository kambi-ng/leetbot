import { fetchDaily } from "../../gql/endpoints";
import { TextChannel } from "discord.js";

export default async function sendToday(channel: TextChannel,) {
  try {
    const data = (await fetchDaily()).data.activeDailyCodingChallengeQuestion
    console.log("this is data", data)
    await channel.send(`difficulty: ${data.question.difficulty}\n title: ${data.question.title}\n link: https://leetcode.com${data.link}`);
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      await channel.send(e.message)
    }
  }

}
