import { Client, ClientEvents, Intents } from "discord.js";
import server from "./server";
import cmd from "./command";
import dotenv from "dotenv";
import PrismaClient from "./prisma/client";
dotenv.config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
  partials: [
    "MESSAGE",
    "CHANNEL",
    "REACTION"
  ]
});


async function main() {

  const events: string[] = [
    "messageCreate",
    "threadCreate",
    "messageReactionAdd",
  ];

  for (const event of events) {
    client.on(
      event,
      (eventObject: ClientEvents) => cmd.handleEvents(event, eventObject)
    );
  }

  client.on("ready", (client: Client) => {
    const user = client.user;
    console.log(`LeetBot has been logged in as ${user?.username} (${user?.tag})!`);
  });

  client.on("error", (error: Error) => {
    console.error("Unexpected error while logging into Discord.");
    console.error(error);
    return;
  });

  client.login(process.env.DC_TOKEN);
  server.startServer();
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await PrismaClient.$disconnect(); });
