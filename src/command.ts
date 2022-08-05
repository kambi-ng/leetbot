import { Message, CacheType, } from "discord.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
import { ApplicationCommandOptionData, ChatInputCommandInteraction, Client } from "discord.js"
import type { ColorResolvable } from "discord.js";

import { fetchDaily, fetchRandom, Question } from "./gql";
import { convert } from "html-to-text"


export type Command = RunCombined | RunSeparate;

export type RunCombined = {
  name: string
  description: string
  options?: ApplicationCommandOptionData[]
  run: (context: CommandContext | MessageContext) => void | Promise<unknown>
}

export type RunSeparate = {
  name: string
  description: string
  options?: ApplicationCommandOptionData[]
  runSlash: (context: CommandContext) => void | Promise<unknown>
  runMessage: (context: MessageContext) => void | Promise<unknown>
}

export type CommandContext = {
  interaction: ChatInputCommandInteraction<CacheType>
  client: Client
}

export type MessageContext = {
  interaction: Message<boolean>
  client: Client
  args?: string[]
}

export const commands: Command[] = [
  {
    name: "ping",
    description: "Test the server reponse",
    run: async ({ interaction }) => {
      await interaction.reply("Pong!");
    }
  },
  {
    name: "today",
    description: "Get today's daily leetcode problem",
    run: async ({ interaction }) => {
      let question: Question
      try {
        const daily = await fetchDaily()
        question = daily.data.activeDailyCodingChallengeQuestion.question
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return { content: e.message };
        }
        return { content: "Something went wrong" };
      }
      await interaction.reply(await createEmbed(question));
    }
  },
  {
    name: "random",
    description: "Get random leetcode problem",
    run: async ({ interaction }) => {
      let question: Question | undefined = undefined
      try {
        let retry = 0
        while (retry < 3) {
          const random = await fetchRandom()
          question = random.data.randomQuestion
          if (question) {
            break
          }
          retry++
          console.log("Retry")
          continue
        }
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
      if (question) {
        return interaction.reply(await createEmbed(question));
      }
      return interaction.reply("Something went wrong");
    }
  },
  {
    name: "help",
    description: "Information on how to use leetbot",
    run: async ({ interaction }) => {
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

async function createEmbed(question: Question) {
  const colors: { [key: string]: ColorResolvable; } = { "Easy": "#40b46f", "Medium": "#ffc528", "Hard": "#f02723" };
  try {

    const embed = new EmbedBuilder()
      .setTitle(question.title)
      .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
      .setDescription(
        convert(
          question.content
            .replace(/<\/?pre>/g, "```")
            .replace(/<\/?code>/g, "`")
            .replace(/<\/?strong>/g, "**")
            .replace(/<\/?em>/g, "*")
            .replace(/<li>/g, "- ")
            .replace(/<\/li>/g, "\n\n")
            // .replace(/\n\s+/g, '\n\n')
        )
      )
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

  } catch (e) {
    console.log(e)
    return "Something went wrong"
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
