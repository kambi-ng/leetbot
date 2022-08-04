import { Message, CacheType, } from "discord.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, Client } from "discord.js"
import type { ColorResolvable } from "discord.js";

import { fetchDaily } from "./gql";
import { convert } from "html-to-text"

type Command = {
  name: string
  description: string
  options?: ApplicationCommandOptionData[]
  runSlash: (context: CommandContext) => void | Promise<unknown>
  runMessage: (context: MessageContext) => void | Promise<unknown>
}

type CommandContext = {
  interaction: ChatInputCommandInteraction<CacheType>
  client: Client
}

type MessageContext = {
  interaction: Message<boolean>
  client: Client
  args?: string[]
}

export const commands: Command[] = [
  {
    name: "ping",
    description: "Test the server reponse",
    runSlash: async ({ interaction }) => {
      await interaction.reply("Pong!");
    },
    runMessage: async ({ interaction }) => {
      await interaction.reply("Pong!");
    }
  },
  {
    name: "today",
    description: "Get today's daily leetcode problem",
    runSlash: async ({ interaction }) => {
      await interaction.reply(await sendToday());
    },
    runMessage: async ({ interaction }) => {
      await interaction.reply(await sendToday());
    }
  },
  {
    name: "help",
    description: "Information on how to use leetbot",
    runSlash: async ({ interaction }) => {
      await interaction.reply(sendHelp());
    },
    runMessage: async ({ interaction }) => {
      await interaction.reply(sendHelp());
    }
  },
  {
    name: "config",
    description: "Configure leetbot",
    runSlash: async ({ interaction }) => {
      await interaction.reply(await sendConfigureServer());
    },
    runMessage: async ({ interaction }) => {
      if (!interaction.member?.permissions.has("Administrator")) {
        interaction.reply("You do not have permission to use this command.");
        return;
      }
      await interaction.reply(await sendConfigureServer());
    },
    // options: [
    //   {
    //     type: ApplicationCommandOptionData,
    //   }
    // ]
  }
]

async function sendToday() {
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

async function sendConfigureServer() {
  return "This feature is not supported yet.";
}

function sendHelp() {
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
