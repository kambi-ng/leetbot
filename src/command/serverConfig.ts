import { Message } from "discord.js";
import { Meta } from "./interfaces";

export function configureServer(META: Meta, message: Message) {

  if (META.commandArgs) {
    switch (META.commandArgs[0]) {
      default:
        message.reply("Uhh... Wrong configuration command. Do you need `/help`?");
        break;
    }
  } else {
    message.reply("Insufficent arguments. Do you need `/help`?");
  }
  return;
}
