import { ApplicationCommandOptionData, ChatInputCommandInteraction, Client, Message, CacheType, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
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
  args: string[];
};

export const commands: Command[] = [
  {
    name: "help",
    description: "Information on how to use leetbot",
    run: async ({ interaction }) => {
      await interaction.reply(sendHelp());
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
    name: "config",
    description: "Configure leetbot",
    runSlash: async ({ interaction }) => {
      if (!interaction.memberPermissions?.has("ManageChannels")) {
        await interaction.reply("You do not have permission to use this command.");
        return;
      }
      await interaction.reply(await sendConfigureServer());
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
    name: "today",
    description: "Get today's daily leetcode problem",
    run: async ({ interaction }) => {
      let question: Question;
      try {
        const { data, errors } = await fetchDaily();
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }
        question = data.activeDailyCodingChallengeQuestion.question;
        await interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply({ content: e.message })
          return
        }
        await interaction.reply({ content: "Something went wrong" })
      }
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
          listId: interaction.options.getString("list") ?? undefined,
          tags: interaction.options
            .getString("tags")
            ?.toLowerCase()
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        };

        const { data, errors } = await fetchRandom(filters);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }
        const question = data.randomQuestion;

        await interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return
        }
        await interaction.reply("Something went wrong");
      }
    },
    runMessage: async ({ interaction, args }) => {
      try {
        const filters: QuestionFilter = {};
        const index = args.findIndex(arg => arg.includes("="))
        if (index !== -1) {
          const difficulty = args[index].toUpperCase();
          if (!(difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD" || difficulty === undefined)) {
            await interaction.reply({ content: "Difficulty should be `EASY`, `MEDIUM` or `HARD`." });
            return
          }
        }
        args?.forEach((arg) => {
          let [key, value] = arg.split("=");
          if (key === "diff") {
            filters["difficulty"] = value.toUpperCase();
          }
          if (key === "list") {
            filters["listId"] = value.toLowerCase();
          }
          if (key === "tags") {
            filters[key] = value
              ?.toLowerCase()
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          }
        });

        const { data, errors } = await fetchRandom(filters);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }
        const question = data.randomQuestion;

        await interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return
        }
        await interaction.reply("Something went wrong");
      }
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
        const name = interaction.options.getString("name")!;
        const filters: QuestionFilter = {
          difficulty: interaction.options.getString("difficulty") ?? undefined,
          listId: interaction.options.getString("list") ?? undefined,
          tags: interaction.options
            .getString("tags")
            ?.toLowerCase()
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        };
        const { data, errors } = await searchQuestion(name, filters);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }
        const question = data.problemsetQuestionList.questions[0];

        await interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return
        }
        await interaction.reply("Something went wrong");
      }
    },
    runMessage: async ({ interaction, args }) => {
      try {
        if (args.length === 0) {
          await interaction.reply("Please provide a name");
          return
        }

        const index = args.findIndex(arg => arg.includes("="))
        if (index !== -1) {
          const difficulty = args[index].toUpperCase();
          if (!(difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD" || difficulty === undefined)) {
            await interaction.reply({ content: "Difficulty should be `EASY`, `MEDIUM` or `HARD`." });
            return
          }
        }
        const filters: QuestionFilter = {};
        args?.forEach((arg) => {
          let [key, value] = arg.split("=");
          if (key === "diff") {
            filters["difficulty"] = value.toUpperCase();
          }
          if (key === "list") {
            filters["listId"] = value.toLowerCase();
          }
          if (key === "tags") {
            filters[key] = value
              ?.toLowerCase()
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          }
        });
        const name = args.filter(arg => !arg.includes("=")).join(" ").toLowerCase();
        const { data, errors } = await fetchQuestion(name);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }

        const question = data.question;

        await interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return
        }
        await interaction.reply("Something went wrong");
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
        let name = interaction.options.getString("name")!;
        const filters: QuestionFilter = {
          difficulty: interaction.options.getString("difficulty")?.toUpperCase(),
          listId: interaction.options.getString("list") ?? undefined,
          tags: interaction.options
            .getString("tags")
            ?.toLowerCase()
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        };
        let page = 0

        const { data, errors } = await searchQuestion(name, filters, page);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }

        const questions = data.problemsetQuestionList.questions;

        const maxPage = Math.ceil(data.problemsetQuestionList.total / 10)
        await interaction.reply({ content: `page ${page + 1}/${maxPage}`, ...await createSearchEmbed(questions, page) });

        const collector = interaction.channel!.createMessageComponentCollector({
          filter: (i) => i.customId === 'prev' || i.customId === 'next',
          time: 15000
        });

        collector.on('collect', async (i) => {
          page = i.customId === 'next' ? page + 1 : page - 1;
          page = Math.max(0, Math.min(page, maxPage - 1));

          const { data, errors } = await searchQuestion(name, filters, page);
          if (errors) {
            await interaction.reply({ content: "Something went wrong" });
            return
          }
          const questions = data.problemsetQuestionList.questions;
          await i.update({ content: `page ${page + 1}/${maxPage}`, ...await createSearchEmbed(questions, page) });
        });

        collector.on('end', () => {
          interaction.editReply({ components: [] })
        });

      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return
        }
        await interaction.reply("Something went wrong");
      }
    },
    runMessage: async ({ interaction, args }) => {
      try {
        if (args.length === 0) {
          await interaction.reply("Please provide a name");
          return;
        }
        const filters: QuestionFilter = {};
        const index = args.findIndex(arg => arg.includes("="))
        if (index !== -1) {
          const difficulty = args[index].toUpperCase();
          if (!(difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD" || difficulty === undefined)) {
            await interaction.reply({ content: "Difficulty should be `EASY`, `MEDIUM` or `HARD`." });
            return
          }
        }
        args?.forEach((arg) => {
          let [key, value] = arg.split("=");
          if (key === "diff") {
            filters["difficulty"] = value.toUpperCase();
          }
          if (key === "list") {
            filters["listId"] = value.toLowerCase();
          }
          if (key === "tags") {
            filters[key] = value
              ?.toLowerCase()
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          }
        });

        const name = args.filter(arg => !arg.includes("=")).join(" ").toLowerCase();
        let page = 0;

        const { data, errors } = await searchQuestion(name, filters, page);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return
        }
        const questions = data.problemsetQuestionList.questions;

        const maxPage = Math.ceil(data.problemsetQuestionList.total / 10)
        const message = await interaction.reply({ content: `page ${page + 1}/${maxPage}`, ...await createSearchEmbed(questions, page) });

        const collector = interaction.channel!.createMessageComponentCollector({
          filter: (i) => i.customId === 'prev' || i.customId === 'next',
          time: 15000
        });

        collector.on('collect', async (i) => {
          page = i.customId === 'next' ? page + 1 : page - 1;
          page = Math.max(0, Math.min(page, maxPage - 1));

          const { data, errors } = await searchQuestion(name, filters, page);
          if (errors) {
            await interaction.reply({ content: "Something went wrong" });
            return
          }
          const questions = data.problemsetQuestionList.questions;
          await i.update({ content: `page ${page + 1}/${maxPage}`, ...await createSearchEmbed(questions, page) });
        });

        collector.on('end', () => {
          message.edit({ components: [] })
        });

      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return
        }
        await interaction.reply("Something went wrong");
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
    return { content: "Something went wrong" };
  }
}

async function createSearchEmbed(questions: Question[], page: number) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Search result")
      .setDescription(
        questions
          .map((q, i) => `${page * 10 + i + 1}) ${q.title} https://leetcode.com/problems/${q.titleSlug}`)
          .join("\n")
      )
      .setColor("#0099ff");
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(new ButtonBuilder().setLabel("<").setStyle(ButtonStyle.Secondary).setCustomId("prev"))
      .addComponents(new ButtonBuilder().setLabel(">").setStyle(ButtonStyle.Secondary).setCustomId("next"))

    return { embeds: [embed], components: [row] };
  } catch (e) {
    console.log(e);
    return { content: "Something went wrong" };
  }
}

async function sendConfigureServer() {
  return { content: "This feature is not supported yet." };
}

function sendHelp() {
  const helpContent = `
***LEETBOT***
Here are available Server commands:
l!ping or /ping
  Test the server reponse
l!help or /help
  Display this message
l!config <args> or /config <args>
  Configure this server, only serevr member with MANAGE_CHANNEL permission
  can use this command. Use \`/config help\` to show available commands.
`
  return { content: helpContent }
}
