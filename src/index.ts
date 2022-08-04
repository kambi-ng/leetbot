import { CacheType, ChatInputCommandInteraction, Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { reply, commands } from "./command";
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
    interaction.reply
    reply("messageCreate", interaction);
  })

  client.on("interactionCreate", async (interaction) => {
    if (interaction instanceof ChatInputCommandInteraction<CacheType>) {
      reply("interactionCreate", interaction);
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
