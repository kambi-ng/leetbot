import {
  Message,
  CacheType,
  ApplicationCommandOptionType,
  MessageReaction,
  ReactionEmoji,
  User,
  CollectorFilter,
  ButtonInteraction
} from "discord.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ApplicationCommandOptionData, ChatInputCommandInteraction, Client } from "discord.js";
import type { ColorResolvable } from "discord.js";

import {
  fetchDaily,
  fetchQuestion,
  fetchRandom,
  listIdMap,
  Question,
  QuestionFilter,
  questionTags,
  searchQuestion,
} from "./gql";
import TurndownService from "turndown";

export type Command = RunCombined | RunSeparate;

export type RunCombined = {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  run: (context: CommandContext | MessageContext) => void | Promise<unknown>;
};

export type RunSeparate = {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  runSlash: (context: CommandContext) => void | Promise<unknown>;
  runMessage: (context: MessageContext) => void | Promise<unknown>;
};

export type CommandContext = {
  interaction: ChatInputCommandInteraction<CacheType>;
  client: Client;
};

export type MessageContext = {
  interaction: Message<boolean>;
  client: Client;
  args?: string[];
};

export const commands: Command[] = [
  {
    name: "ping",
    description: "Test the server reponse",
    run: async ({ interaction }) => {
      await interaction.reply("Pong!");
    },
  },
  {
    name: "today",
    description: "Get today's daily leetcode problem",
    run: async ({ interaction }) => {
      let question: Question;
      try {
        const daily = await fetchDaily();
        question = daily.data.activeDailyCodingChallengeQuestion.question;
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return { content: e.message };
        }
        return { content: "Something went wrong" };
      }
      await interaction.reply(await createEmbed(question));
    },
  },
  {
    name: "random",
    description: "Get random leetcode problem",
    options: [
      {
        name: "difficulty",
        description: "chose difficulty of the problem",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Easy", value: "EASY" },
          { name: "Medium", value: "MEDIUM" },
          { name: "Hard", value: "HARD" },
        ],
      },
      {
        name: "tags",
        description: "chose tags of the problem, separated by comma",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "list",
        description: "chose from which list to get the problem",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: Object.entries(listIdMap).map(([name, value]) => ({ name, value })),
      },
    ],
    runSlash: async ({ interaction }) => {
      try {
        const filters: QuestionFilter = {
          difficulty: interaction.options.getString("difficulty") ?? undefined,
          tags: interaction.options
            .getString("tags")
            ?.split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
          listId: interaction.options.getString("list") ?? undefined,
        };
        const random = await fetchRandom({ categorySlug: "", filters });
        const question = random.data.randomQuestion;
        return interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
    },
    runMessage: async ({ interaction, args }) => {
      try {
        const filters: QuestionFilter = {};
        if (args) {
          args.forEach((arg) => {
            let [key, value] = arg.split("=");
            if (key === "tags") {
              const tags = value.split(",");
              filters[key] = tags;
            }
            if (key === "diff") {
              value = value.toUpperCase();
              if (value === "EASY" || value === "MEDIUM" || value === "HARD") {
                filters["difficulty"] = value;
              }
            }
            if (key === "list") {
              filters["listId"] = value;
            }
          });
        }
        const random = await fetchRandom({ categorySlug: "", filters });
        const question = random.data.randomQuestion;
        return interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
    },
  },
  {
    name: "help",
    description: "Information on how to use leetbot",
    run: async ({ interaction }) => {
      await interaction.reply(sendHelp());
    },
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
  },
  {
    name: "tags",
    description: "Get all the available tags",
    run: async ({ interaction }) => {
      const embed = new EmbedBuilder()
        .setTitle("Available tags")
        .setDescription(questionTags.join("\n"))
        .setColor("#0099ff");

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "question",
    description: "get a leetcode question",
    options: [
      {
        name: "name",
        description: "question name or slugs",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
    runSlash: async ({ interaction }) => {
      try {
        let name = interaction.options.getString("name")!;
        const search = await searchQuestion(name);
        const question = search.data.problemsetQuestionList.questions[0];
        return interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
    },
    runMessage: async ({ interaction, args }) => {
      try {
        let name = "";
        if (args) {
          if (args.length == 1) {
            name = args[0];
          } else if (args.length > 1) {
            name = args.join("-").toLowerCase();
          }
        }
        const questionData = await fetchQuestion(name);
        const question = questionData.data.question;
        return interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
    },
  },
  {
    name: "search",
    description: "Search leetcode question",
    options: [
      {
        name: "name",
        description: "question name or slugs",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
    runSlash: async ({ interaction }) => {
      try {
        let name = interaction.options.getString("name")!;
        const search = await searchQuestion(name);
        const questions = search.data.problemsetQuestionList.questions;
        const message = await interaction.reply(await createSearchEmbed(questions));

        const collector = interaction.channel!.createMessageComponentCollector({
          filter: (i) => {
            return i.customId === 'prev' || i.customId === 'next';
          }, time: 1500
        });

        collector.on('collect', async i => {
          await i.update({ content: 'A button was clicked!' });
        });

        collector.on('end', collected => console.log(`Collected ${collected.size} items`));

      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
    },
    runMessage: async ({ interaction, args }) => {
      try {
        let name = "";
        if (args) {
          if (args.length == 1) {
            name = args[0];
          } else if (args.length > 1) {
            name = args.join("-").toLowerCase();
          }
        }
        const questionData = await fetchQuestion(name);
        const question = questionData.data.question;
        return interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return interaction.reply(e.message);
        }
        return interaction.reply("Something went wrong");
      }
    },
  },
];

async function createEmbed(question: Question) {
  const colors: { [key: string]: ColorResolvable } = {
    Easy: "#40b46f",
    Medium: "#ffc528",
    Hard: "#f02723",
  };
  const turndownService = new TurndownService();
  try {
    const embed = new EmbedBuilder()
      .setTitle(question.title)
      .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
      .setDescription(turndownService.turndown(question.content ?? "none"))
      .setColor(colors[question.difficulty])
      .setTimestamp(Date.now())
      .setFields([
        { name: "Difficulty", value: question.difficulty, inline: true },
        { name: "Tags", value: question.topicTags.map((t) => t.name).join(", "), inline: true },
        {
          name: "Acceptance",
          value: String(Math.round(question.acRate * 100) / 100) + "%",
          inline: true,
        },
        { name: "Likes", value: String(question.likes), inline: true },
        { name: "Dislikes", value: String(question.dislikes), inline: true },
      ]);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("View")
        .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
        .setStyle(ButtonStyle.Link)
    );

    return { embeds: [embed], components: [row] };
  } catch (e) {
    console.log(e);
    return "Something went wrong";
  }
}

async function createSearchEmbed(questions: Question[]) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Search result")
      .setDescription(
        questions
          .map((q) => `${q.title} https://leetcode.com/problems/${q.titleSlug}`)
          .join("\n")
      )
      .setColor("#0099ff");
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(new ButtonBuilder().setLabel("<").setStyle(ButtonStyle.Secondary).setCustomId("prev"))
      .addComponents(new ButtonBuilder().setLabel(">").setStyle(ButtonStyle.Secondary).setCustomId("next"))

    return { embeds: [embed], components: [row] };
  } catch (e) {
    console.log(e);
    return "Something went wrong";
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
