import { TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { fetchDaily } from "../../gql/endpoints";
import type { ColorResolvable } from "discord.js";
import { convert } from "html-to-text"

export default async function sendToday(channel: TextChannel) {
  const colors: { [key: string]: ColorResolvable } = { "Easy": "#40b46f", "Medium": "#ffc528", "Hard": "#f02723" };
  try {
    const data = (await fetchDaily()).data.activeDailyCodingChallengeQuestion

    const embed = new EmbedBuilder()
      .setTitle(data.question.title)
      .setURL(`https://leetcode.com${data.link}`)
      .setDescription(convert(data.question.content).replace(/\n\s+/g, '\n\n'))
      .setColor(colors[data.question.difficulty])
      .setTimestamp(Date.now())
      .setFields([
        { name: "Difficulty", value: data.question.difficulty, inline: true },
        { name: "Tags", value: data.question.topicTags.map(t => t.name).join(', '), inline: true },
        { name: "Acceptance", value: String(Math.round(data.question.acRate * 100) / 100) + "%", inline: true },
        { name: "Likes", value: String(data.question.likes), inline: true },
        { name: "Dislikes", value: String(data.question.dislikes), inline: true },
      ])

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(new ButtonBuilder()
        .setLabel("View")
        .setURL(`https://leetcode.com${data.link}`)
        .setStyle(ButtonStyle.Link)
      )

    await channel.send({ embeds: [embed], components: [row] })

  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      await channel.send(e.message)
    }
  }
}
