import {
  CacheType,
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import dotenv from "dotenv";
import { commands, configManager, createEmbed } from "./command";
import { mkdir } from "node:fs/promises";
import { fetchDaily, Question } from "./gql";

dotenv.config();

const DEFAULT_SETTINGS_PATH = "settings";

export function getSettingsPath() {
  // asuming on unix like
  return (
    (process.env.SETTINGS_PATH ?? DEFAULT_SETTINGS_PATH) + "/settings.json"
  );
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// TODO: move everything to one file
// TODO: remove message command and use slash command only
// TODO: make question embed to create thread and start it with the question
// TODO: add integration to leetcode and make it able to submit the answer to leetcode
// NOTE: make backend save session and cookie to make it able to submit the answer. make modal to submit username and password
// NOTE: i can use csrf from cookie and login to leetcode to submit the answer. might need to move a proper database. need to rethink
// TODO: make ranks and leaderboard
// TODO: maybe make it link to a github repo and make it user can submit their answer to comunity repo
async function main() {
  // create dir if not exist
  await mkdir(process.env.SETTINGS_PATH ?? DEFAULT_SETTINGS_PATH, {
    recursive: true,
  });

  client.on("ready", async (client) => {
    await client.application.commands.set(commands);

    const { username, tag } = client.user;
    console.log(`LeetBot has been logged in as ${username} (${tag})!`);
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction instanceof ChatInputCommandInteraction) {
      const command = commands.find((c) => c.name === interaction.commandName)!;

      try {
        await command?.run({ interaction, client });
      } catch (e) {
        console.error(e);
      }
    }
  });

  client.on("error", (error: Error) => {
    console.error("Unexpected error while logging into Discord.");
    console.error(error);
    return;
  });

  client.login(process.env.DC_TOKEN);
}

function worker() {
  console.log("Worker started");
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  console.log(`Current time is ${currentTime}`);
  // loop all settings in every minute. Check if the time is the same as the current time and send the message

  setInterval(async () => {
    const data = await configManager.getConfigs();
    if (!data) return;

    const { configs, release } = data;
    for (const [guildId, record] of Object.entries(configs)) {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      if (record.time === currentTime) {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(record.channelId);
        if (channel && "send" in channel) {
          if (record.command == "today") {
            let question: Question;
            try {
              const { data, errors } = await fetchDaily();
              if (errors) {
                await channel.send({ content: "Question not found." });
                return;
              }
              question = data.activeDailyCodingChallengeQuestion.question;
              const embed = await createEmbed(question);

              const message = await channel.send(embed);
              if ("content" in embed) {
                return;
              }

              await message.startThread({
                name: question.title,
                autoArchiveDuration: 60 * 24 * 3, // 3 days
              });
            } catch (e) {
              console.error(e);
              if (e instanceof Error) {
                await channel.send({ content: e.message });
                return;
              }
              await channel.send({ content: "Something went wrong" });
            }
          }
        }
      }
    }

    release();
  }, 60 * 1000);
}

Promise.allSettled([main(), worker()]).catch((e) => console.error(e));
