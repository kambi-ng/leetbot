import { Message, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, MessageOptions, ApplicationCommandOptionData, ChatInputCommandInteraction, Client } from "discord.js";
import type { ColorResolvable } from "discord.js";
import { fetchDaily } from "./gql/endpoints";
import { convert } from "html-to-text"


type Command = {
  name: string
  description: string
  options?: ApplicationCommandOptionData[]
  run: (context: CommandContext) => void | Promise<unknown>
}

type CommandContext = {
  interaction: ChatInputCommandInteraction
  client: Client
}

export const commands: Command[] = [
  {
    name: "ping",
    description: "Test the server reponse",
    run: async (context: CommandContext) => {

    }
  },
  {
    name: "today",
    description: "Get today's daily leetcode problem",
    run: async (context: CommandContext) => {
    }
  }

]

export async function reply(type: string, event: Message<boolean> | ChatInputCommandInteraction<CacheType>) {
  let command: string = ""
  let args: string[]

  if (event instanceof Message) {
    if (!event.content.startsWith("l!") || event.author.bot || event.author.id === event.client.user?.id) return
    [command, ...args] = event.content.trim().slice(2).split(/\s+/);
    console.log("command", command, args);
  }

  if (event instanceof ChatInputCommandInteraction) {
    command = event.commandName
    console.log("command", command);
  }

  switch (command) {
    case "ping":
      event.reply("PONG");
      break;
    case "help":
      event.reply(sendHelp())
      break;
    case "config":
      // if (!event.member?.permissions.has("Administrator")) {
      //   event.reply("You do not have permission to use this command.");
      //   return;
      // }
      // configureServer(event, args);
      break;
    case "today":
      // @ts-ignore
      event.reply(await sendToday())
      break;
    default:
      console.log("Unknown command: ", command);
      event.reply("Sorry, I don't quite understand. Do you need `/help`?");
      break;
  }
}

async function sendToday(): Promise<MessageOptions> {
  const colors: { [key: string]: ColorResolvable; } = { "Easy": "#40b46f", "Medium": "#ffc528", "Hard": "#f02723" };

  try {
    const data = (await fetchDaily()).data.activeDailyCodingChallengeQuestion;

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
      ]);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(new ButtonBuilder()
        .setLabel("View")
        .setURL(`https://leetcode.com${data.link}`)
        .setStyle(ButtonStyle.Link)
      );

    return { embeds: [embed], components: [row] };

  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return { content: e.message };
    }
    return { content: "Something went wrong" };
  }
}

async function configureServer(args: string[]): Promise<string> {
  return "This feature is not supported yet.";
}

function sendHelp(): string {
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

  return helpContent;
}
