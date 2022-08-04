import { Client, ClientEvents, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import cmd from "./command";
import server from "./server";
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
}

main()
  .catch(e => console.error(e));
