import { ClientEvents, Message, MessageReaction, ThreadChannel, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { ColorResolvable } from "discord.js";
import { fetchDaily } from "./gql/endpoints";
import { convert } from "html-to-text"

function isMessage(eventObj: Message | ClientEvents): eventObj is Message {
  const premise = eventObj as Message;
  return premise.member !== undefined &&
    premise.tts !== undefined;
}

function isReact(eventObj: MessageReaction | ClientEvents): eventObj is MessageReaction {
  const premise = eventObj as MessageReaction;
  return premise.message !== undefined &&
    premise.emoji != undefined;
}

function isThread(eventObj: ThreadChannel | ClientEvents): eventObj is ThreadChannel {
  const premise = eventObj as ThreadChannel;
  return premise.autoArchiveDuration != undefined;
}

function handleEvents(type: string, event: ClientEvents) {
  console.log("type", { "message": event instanceof Message, "react": event instanceof MessageReaction, "thread": event instanceof ThreadChannel });
  if (isMessage(event)) {
    if (!event.content.startsWith("l!") || event.author.bot || event.author.id === event.client.user?.id) return

    const [command, ...args] = event.content.trim().slice(2).split(/\s+/);
    console.log("command", command, args);
    switch (command) {
      case "ping":
        event.reply("PONG");
        break;
      case "help":
        if (event.channel instanceof TextChannel) {
          sendHelp(event.channel)
        }
        break;
      case "config":
        if (!event.member?.permissions.has("Administrator")) {
          event.reply("You do not have permission to use this command.");
          return;
        }
        configureServer(event, args);
        break;
      case "today":
        if (event.channel instanceof TextChannel) {
          sendToday(event.channel)
        }
        break;
      default:
        console.log("Unknown command: ", command);
        event.reply("Sorry, I don't quite understand. Do you need `/help`?");
        break;
    }
  }
}

async function sendToday(channel: TextChannel) {
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

async function configureServer(event: ClientEvents & Message<boolean>, args: string[]) {
  event.channel.send("This feature is not supported yet.");
}

async function sendHelp(channel: TextChannel) {
  const helpContent = `
***LEETBOT***
Here are available Server commands:
l!ping
  Test the server reponse
l!help
  Display this message
l!config <args>
  Configure this server, only serevr member with MANAGE_CHANNEL permission
  can use this command. Use \`!!config help\` to show available commands.
`;

  await channel.send(helpContent);
}

export default {
  handleEvents
};
