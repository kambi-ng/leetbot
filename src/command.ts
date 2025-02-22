import {
  ApplicationCommandOptionData,
  ChatInputCommandInteraction,
  Client,
  Message,
  CacheType,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionResolvable,
  ChannelType,
} from "discord.js";
import type { ColorResolvable } from "discord.js";
import { Mutex, MutexInterface } from "async-mutex";
import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";

export const tryCatch = <Data, FnArgs extends any[]>(
  fn: (...args: FnArgs) => Data,
  ...fnArgs: FnArgs
): [Error] | [null, Data] => {
  try {
    return [null, fn(...fnArgs)];
  } catch (err) {
    if (!(err instanceof Error)) {
      return [new Error(String(err))];
    }
    return [err];
  }
};

export const tryToCatch = async <Data, FnArgs extends any[]>(
  fn: (...args: FnArgs) => Promise<Data> | Data,
  ...fnArgs: FnArgs
): Promise<[Error] | [null, Data]> => {
  try {
    return [null, await fn(...fnArgs)];
  } catch (err) {
    if (!(err instanceof Error)) {
      return [new Error(String(err))];
    }
    return [err];
  }
};

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
import { client, getSettingsPath } from ".";

const configSchema = z.record(
  z.object({
    channelId: z.string(),
    time: z.string(),
    command: z.string(),
  }),
);

type Config = z.infer<typeof configSchema>["guildId"];

class ConfigManager {
  mutex: Mutex;

  constructor() {
    this.mutex = new Mutex();
  }

  async getConfig(
    guildId: string,
  ): Promise<{ release: MutexInterface.Releaser; config: Config } | undefined> {
    const release = await this.mutex.acquire();

    const settingsPath = getSettingsPath();
    let [readErr, rawSettings] = await tryToCatch(
      readFile,
      settingsPath,
      "utf-8",
    );
    //@ts-ignore
    if (readErr && readErr.code !== "ENOENT") {
      console.error(readErr);
      return undefined;
    }

    if (rawSettings === undefined) {
      return undefined;
    }

    // i know this is stupid, but i'm too lazy to fix it
    let [err, unverifiedSettings] = tryCatch(JSON.parse, rawSettings as string);
    if (err) {
      console.error(err);
      if (err instanceof SyntaxError) {
        unverifiedSettings = {};
      }
    }

    const settings = configSchema.safeParse(unverifiedSettings);
    if (!settings.success) {
      console.error(settings.error);
      return undefined;
    }

    const config = settings.data[guildId];

    return { release, config };
  }

  async getConfigs(): Promise<
    | { release: MutexInterface.Releaser; configs: Record<string, Config> }
    | undefined
  > {
    const release = await this.mutex.acquire();

    const settingsPath = getSettingsPath();
    let [readErr, rawSettings] = await tryToCatch(
      readFile,
      settingsPath,
      "utf-8",
    );
    //@ts-ignore
    if (readErr && readErr.code !== "ENOENT") {
      console.error(readErr);
      return undefined;
    }

    if (rawSettings === undefined) {
      return undefined;
    }

    // i know this is stupid, but i'm too lazy to fix it
    let [err, unverifiedSettings] = tryCatch(JSON.parse, rawSettings as string);
    if (err) {
      console.error(err);
      if (err instanceof SyntaxError) {
        unverifiedSettings = {};
      }
    }

    const settings = configSchema.safeParse(unverifiedSettings);
    if (!settings.success) {
      console.error(settings.error);
      return undefined;
    }

    const configs = settings.data;

    return { release, configs };
  }

  async setConfig(guildId: string, config: Config) {
    return this.mutex.runExclusive(async () => {
      const settingsPath = getSettingsPath();
      let [readErr, rawSettings] = await tryToCatch(
        readFile,
        settingsPath,
        "utf-8",
      );
      //@ts-ignore
      if (readErr && readErr.code !== "ENOENT") {
        console.error(readErr);
        return readErr;
      } else {
        rawSettings = "{}";
      }
      // i know this is stupid, but i'm too lazy to fix it
      let [err, unverifiedSettings] = tryCatch(
        JSON.parse,
        rawSettings as string,
      );
      if (err) {
        console.error(err);
        if (err instanceof SyntaxError) {
          unverifiedSettings = {};
        } else {
          return err;
        }
      }

      const settings = configSchema.safeParse(unverifiedSettings);
      if (!settings.success) {
        console.error(settings.error);
        return settings.error;
      }

      settings.data[guildId] = config;

      await writeFile(settingsPath, JSON.stringify(settings.data, null, 2));
    });
  }
}

export const configManager = new ConfigManager();

export type Command = RunCombined;

export type RunCombined = {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultMemberPermissions?: PermissionResolvable;
  run: (context: CommandContext) => void | Promise<unknown>;
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
      const embed = new EmbedBuilder()
        .setTitle("LEETBOT")
        .setDescription(
          `
**LEETBOT**
Here are available Server commands:
- \`/help\` Display this message
- \`/setting\` [time] [channelid] [command] Configure the daily question, only serevr member with \`MANAGE_CHANNEL\` permission can use this command.
- \`/getsetting\` get server setting for daily question, only serevr member with \`MANAGE_CHANNEL\` permission can use this command.
- \`/today\` Get today's daily leetcode problem
- \`/random\` [difficulty] [tags] [list] Get random leetcode problem
- \`/search\` [name] [difficulty] [tags] [list] Search leetcode question
- \`/tags\` Get all the available tags
`,
        )
        .setColor("#0099ff")
        .setURL("https://leetcode.com");

      await interaction.reply({ embeds: [embed] });
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
    name: "setting",
    description: "Setup leetbot for daily question",
    defaultMemberPermissions: ["ManageChannels"],
    options: [
      {
        name: "time",
        description: "time of the day in 24h format",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "channelid",
        description: "channel id, name, or \"this\" to send the question",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "command",
        description: "chose difficulty of the problem",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "today", value: "today" },
          // { name: "random", value: "random" },
        ],
      },
    ],
    run: async ({ interaction }) => {
      if (!interaction.memberPermissions?.has("ManageChannels")) {
        await interaction.reply(
          "You do not have permission to use this command.",
        );
        return;
      }

      const time = interaction.options.getString("time")!;
      let channelId = interaction.options.getString("channelid")!;
      const command = interaction.options.getString("command")!;

      // validate if the time is in 24h format
      const HOURS_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (!HOURS_REGEX.test(time)) {
        await interaction.reply({
          content: "Invalid time format. Please use 24h format.",
          ephemeral: true,
        });
        return;
      }

      if (channelId === "this") {
        channelId = interaction.channelId;
      } else if (!client.channels.cache.has(channelId)) {
        const channelName = channelId;

        const channel = client.channels.cache.find((c) => {
          if (c.type !== ChannelType.GuildText) return false;
          return c.name === channelName;
        });

        if (!channel) {
          await interaction.reply({
            content: "Invalid channel",
            ephemeral: true,
          });
          return;
        }

        channelId = channel.id;
      }

      const config: Config = {
        channelId,
        time,
        command,
      };

      await interaction.reply({
        content: "Saving configuration...",
        ephemeral: true,
      });

      const res = await configManager.setConfig(interaction.guildId!, config);
      if (res) {
        await interaction.editReply("Something went wrong.");
        return;
      }

      await interaction.editReply("Configuration has been saved.");
    },
  },
  {
    name: "getsettings",
    description: "Get leetbot settings",
    defaultMemberPermissions: ["ManageChannels"],
    run: async ({ interaction }) => {
      if (!interaction.memberPermissions?.has("ManageChannels")) {
        await interaction.reply(
          "You do not have permission to use this command.",
        );
        return;
      }

      const data = await configManager.getConfig(interaction.guildId!);
      if (!data || !data.config) {
        await interaction.reply("No configuration found.");
        return;
      }

      const { config, release } = data;

      const embed = new EmbedBuilder()
        .setTitle("Configuration")
        .setDescription(
          `Channel: <#${config?.channelId}>\nTime: ${config?.time}\nCommand: ${config?.command}`,
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
      release();
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
          return;
        }
        question = data.activeDailyCodingChallengeQuestion.question;
        const embed = await createEmbed(question);
        await interaction.reply(embed);

        if ("content" in embed) {
          return;
        }

        const collector = interaction.channel!.createMessageComponentCollector({
          filter: (i) => i.customId === "thread",
          time: 5 * 60 * 1000,
        });

        collector.on("collect", async (i) => {
          await i.deferUpdate();
          await i.message.startThread({
            name: `${question.questionId}. ${question.title}`,
            autoArchiveDuration: 60 * 24 * 3, // 3 days
          });
        });

        collector.on("end", async (collected) => {
          console.log(`Collected ${collected.size} threads`);
          interaction.editReply({ components: embed.editedComponents });
        });
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply({ content: e.message });
          return;
        }
        await interaction.reply({ content: "Something went wrong" });
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
        choices: Object.entries(listIdMap).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
    run: async ({ interaction }) => {
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
          return;
        }
        const question = data.randomQuestion;

        const embed = await createEmbed(question);
        await interaction.reply(embed);

        if ("content" in embed) {
          return;
        }

        const collector = interaction.channel!.createMessageComponentCollector({
          filter: (i) => i.customId === "thread",
          time: 5 * 60 * 1000,
        });

        collector.on("collect", async (i) => {
          await i.deferUpdate();
          await i.message.startThread({
            name: `${question.questionId}. ${question.title}`,
            autoArchiveDuration: 60 * 24 * 3, // 3 days
          });
        });

        collector.on("end", async (collected) => {
          console.log(`Collected ${collected.size} threads`);
          interaction.editReply({ components: embed.editedComponents });
        });
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return;
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
        choices: Object.entries(listIdMap).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
    run: async ({ interaction }) => {
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
          return;
        }
        const question = data.problemsetQuestionList.questions[0];

        await interaction.reply(await createEmbed(question));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return;
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
        choices: Object.entries(listIdMap).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
    run: async ({ interaction }) => {
      try {
        let name = interaction.options.getString("name")!;
        const filters: QuestionFilter = {
          difficulty: interaction.options
            .getString("difficulty")
            ?.toUpperCase(),
          listId: interaction.options.getString("list") ?? undefined,
          tags: interaction.options
            .getString("tags")
            ?.toLowerCase()
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        };
        let page = 0;

        const { data, errors } = await searchQuestion(name, filters, page);
        if (errors) {
          await interaction.reply({ content: "Question not found." });
          return;
        }

        const questions = data.problemsetQuestionList.questions;

        const maxPage = Math.ceil(data.problemsetQuestionList.total / 10);
        await interaction.reply({
          content: `page ${page + 1}/${maxPage}`,
          ...(await createSearchEmbed(questions, page)),
        });

        const collector = interaction.channel!.createMessageComponentCollector({
          filter: (i) => i.customId === "prev" || i.customId === "next",
          time: 15 * 1000,
        });

        collector.on("collect", async (i) => {
          page = i.customId === "next" ? page + 1 : page - 1;
          page = Math.max(0, Math.min(page, maxPage - 1));

          const { data, errors } = await searchQuestion(name, filters, page);
          if (errors) {
            await interaction.reply({ content: "Something went wrong" });
            return;
          }
          const questions = data.problemsetQuestionList.questions;
          await i.update({
            content: `page ${page + 1}/${maxPage}`,
            ...(await createSearchEmbed(questions, page)),
          });
        });

        collector.on("end", () => {
          interaction.editReply({ components: [] });
        });
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          await interaction.reply(e.message);
          return;
        }
        await interaction.reply("Something went wrong");
      }
    },
  },
];

export async function createEmbed(question: Question) {
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
        {
          name: "Tags",
          value: question.topicTags.map((t) => t.name).join(", "),
          inline: true,
        },
        {
          name: "Acceptance",
          value: String(Math.round(question.acRate * 100) / 100) + "%",
          inline: true,
        },
        { name: "Likes", value: String(question.likes), inline: true },
        { name: "Dislikes", value: String(question.dislikes), inline: true },
      ]);

    const view = new ButtonBuilder()
      .setLabel("View")
      .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
      .setStyle(ButtonStyle.Link);

    const editedView = new ButtonBuilder()
      .setLabel("View")
      .setURL(`https://leetcode.com/problems/${question.titleSlug}`)
      .setStyle(ButtonStyle.Link);

    const thread = new ButtonBuilder()
      .setLabel("Create Thread")
      .setCustomId("thread")
      .setStyle(ButtonStyle.Primary);

    const threadDisable = new ButtonBuilder()
      .setLabel("Create Thread")
      .setCustomId("thread")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(view)
      .addComponents(thread);

    const editedRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(editedView)
      .addComponents(threadDisable);

    return {
      embeds: [embed],
      components: [row],
      editedComponents: [editedRow],
    };
  } catch (e) {
    console.error(e);
    return { content: "Something went wrong" };
  }
}

async function createSearchEmbed(questions: Question[], page: number) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Search result")
      .setDescription(
        questions
          .map(
            (q, i) =>
              `${page * 10 + i + 1}) ${q.title} https://leetcode.com/problems/${q.titleSlug}`,
          )
          .join("\n"),
      )
      .setColor("#0099ff");
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel("<")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("prev"),
      )
      .addComponents(
        new ButtonBuilder()
          .setLabel(">")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("next"),
      );

    return { embeds: [embed], components: [row] };
  } catch (e) {
    console.error(e);
    return { content: "Something went wrong" };
  }
}
