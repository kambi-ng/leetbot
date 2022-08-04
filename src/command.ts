import { Message, CacheType, } from "discord.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, Client } from "discord.js"
import type { ColorResolvable } from "discord.js";

import { fetchDaily, Question } from "./gql";
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
      if (!interaction.memberPermissions?.has("ManageChannels")) {
        await interaction.reply(await sendConfigureServer());
        return;
      }
      await interaction.reply("You do not have permission to use this command.");
    },
    runMessage: async ({ interaction }) => {
      if (!interaction.member?.permissions.has("ManageChannels")) {
        interaction.reply("You do not have permission to use this command.");
        return;
      }
      await interaction.reply(await sendConfigureServer());
    },
  }
]

async function sendToday(question: Question) {
  const colors: { [key: string]: ColorResolvable; } = { "Easy": "#40b46f", "Medium": "#ffc528", "Hard": "#f02723" };
  const embed = new EmbedBuilder()
    .setTitle(question.title)
    .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
    .setDescription(convert(question.content).replace(/\n\s+/g, '\n\n'))
    .setColor(colors[question.difficulty])
    .setTimestamp(Date.now())
    .setFields([
      { name: "Difficulty", value: question.difficulty, inline: true },
      { name: "Tags", value: question.topicTags.map(t => t.name).join(', '), inline: true },
      { name: "Acceptance", value: String(Math.round(question.acRate * 100) / 100) + "%", inline: true },
      { name: "Likes", value: String(question.likes), inline: true },
      { name: "Dislikes", value: String(question.dislikes), inline: true },
    ]);

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(new ButtonBuilder()
      .setLabel("View")
      .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
      .setStyle(ButtonStyle.Link)
    );

  return { embeds: [embed], components: [row] };
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
