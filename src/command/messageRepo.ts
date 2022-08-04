import { Message } from "discord.js";
import { Meta } from "./interfaces";
import { configureServer } from "./serverConfig";
import sendToday from "./daily-question/index"
function delegate(META: Meta, message: Message) {

  // TODO: handle prefix change

  switch (META.command) {
    case "!!ping":
      message.reply("PONG");
      break;
    case "!!help":
      sendHelp(message);
      break;
    case "!!config":
      if (!META.isMod || !META.fromGuild || !META.commandArgs) return;
      configureServer(META, message);
      break;
    case "!!today":
      if (META.channel){
        sendToday(META.channel)
      }
      break;
    default:
    console.log("Unknown command: ", META.command);
      // message.reply("Sorry, I don't quite understand. Do you need `/help`?");
      break;
  }
  return;
}

function sendHelp(message: Message) {
  const helpContent = `
***LEETBOT***

Here are available Server commands:

    !!ping
        Test the server reponse

    !!help
        Display this message

    !!config <args>
        Configure this server, only serevr member with MANAGE_CHANNEL permission
        can use this command. Use \`!!config help\` to show available commands.
`;

  message.channel.send(helpContent);
}

export default { delegate };