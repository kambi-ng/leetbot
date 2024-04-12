import { CacheType, ChatInputCommandInteraction, Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { commands, configManager, createEmbed } from "./command";
import { readFile, mkdir } from "node:fs/promises"
import { fetchDaily, Question } from "./gql";

dotenv.config();

const DEFAULT_SETTINGS_PATH = "settings";

export function getSettingsPath() {
  // asuming on unix like
  return (process.env.SETTINGS_PATH ?? DEFAULT_SETTINGS_PATH) + "/settings.json";
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
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ]
});

async function main() {
  // create dir if not exist
  await mkdir(process.env.SETTINGS_PATH ?? DEFAULT_SETTINGS_PATH, { recursive: true })

  client.on("ready", async (client) => {
    await client.application.commands.set(commands);

    const { username, tag } = client.user;
    console.log(`LeetBot has been logged in as ${username} (${tag})!`);
  });

  client.on("messageCreate", async (interaction) => {
    if (!interaction.content.startsWith("l!") || interaction.author.bot || interaction.author.id === interaction.client.user?.id) return
    const [commandName, ...args] = interaction.content.trim().slice(2).match(/"[^"]+"|[^\s]+/g)?.map(e => e.replace(/"(.+)"/, "$1")) ?? [];
    const command = commands.find(c => c.name === commandName)

    if (!command) {
      interaction.reply("Sorry, I don't quite understand. Do you need `l!help` or `/help`?")
      return
    }

    if ("run" in command!) {
      await command.run({ interaction, client, args })
    } else {
      await command?.runMessage({ interaction, client, args })
    }

  })

  client.on("interactionCreate", async (interaction) => {
    if (interaction instanceof ChatInputCommandInteraction<CacheType>) {
      const command = commands.find(c => c.name === interaction.commandName)!

      if ("run" in command!) {
        await command.run({ interaction, client })
      } else {
        await command?.runSlash({ interaction, client })
      }
    }
  })

  client.on("error", (error: Error) => {
    console.error("Unexpected error while logging into Discord.");
    console.error(error);
    return;
  });

  client.login(process.env.DC_TOKEN);


}

function worker() {
  console.log("Worker started")
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  console.log(`Current time is ${currentTime}`)
  // loop all settings in every minute. Check if the time is the same as the current time and send the message

  setInterval(async () => {
    const data = await configManager.getConfigs()
    if (!data) return

    const { configs, release } = data
    for (const [guildId, record] of Object.entries(configs)) {
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      console.log(`Checking guild ${guildId} with time ${record.time} and current time ${currentTime}`)

      if (record.time === currentTime) {
        const guild = await client.guilds.fetch(guildId)
        console.log(`Sending message to guild ${guild}`)

        const channel = await guild.channels.fetch(record.channelId)
        console.log(`Sending message to channel ${channel}`)

        if (channel && "send" in channel) {
          if (record.command == "today") {

            let question: Question;
            try {
              const { data, errors } = await fetchDaily();
              if (errors) {
                await channel.send({ content: "Question not found." });
                return
              }
              question = data.activeDailyCodingChallengeQuestion.question;
              await channel.send(await createEmbed(question));
            } catch (e) {
              console.error(e);
              if (e instanceof Error) {
                await channel.send({ content: e.message })
                return
              }
              await channel.send({ content: "Something went wrong" })
            }
          }
        }
      }
    }

    release()
  }, 60 * 1000)
}

Promise.allSettled([main(), worker()]).catch(e => console.error(e));
