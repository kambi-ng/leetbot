import { CacheType, ChatInputCommandInteraction, Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { commands } from "./command";
dotenv.config();

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

main().catch(e => console.error(e));
