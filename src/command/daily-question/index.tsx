import { fetchDaily } from "../../gql/endpoints";
import { TextChannel } from "discord.js";
import { ReacordDiscordJs, Embed } from "reacord"
import React from "react"
import { convert } from "html-to-text"

export default async function sendToday(channel: TextChannel, reacord: ReacordDiscordJs) {
  try {
    const data = (await fetchDaily()).data.activeDailyCodingChallengeQuestion

    reacord.send(channel.id,
      <Embed
        title={data.question.title}
        url={`https://leetcode.com${data.link}`}
        description={convert(data.question.content).replace(/\n\s+/g, '\n\n')}
        color={0x00ff00}
        timestamp={Date.now()}
        fields={[
          { name: "Difficulty", value: data.question.difficulty, inline: true },
          { name: "Tags", value: data.question.topicTags.map(t => t.name).join(', '), inline: true },
          { name: "Acceptance", value: String(Math.round(data.question.acRate * 100) / 100) + "%", inline: true },
          { name: "Likes", value: String(data.question.likes), inline: true },
          { name: "Dislikes", value: String(data.question.dislikes), inline: true },
        ]}
      />

    )
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      await channel.send(e.message)
    }
  }
}
