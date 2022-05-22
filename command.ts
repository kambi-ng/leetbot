import { ClientEvents, Message, MessageReaction, Permissions, ThreadChannel } from "discord.js";
import messageRepo from "./command/messageRepo";
import reactionRepo from "./command/reactionRepo";
import threadRepo from "./command/threadRepo";
import { Meta } from "./command/interfaces";

function isMessage(eventObj: Message | ClientEvents): eventObj is Message {
  const premise = eventObj as Message;
  return premise.member !== undefined &&
        premise.tts !== undefined;
}

function isReact(eventObj: MessageReaction | ClientEvents): eventObj is MessageReaction {
  const premise = eventObj as MessageReaction;
  return premise.message !== undefined &&
        premise.emoji != undefined;
}

function isThread(eventObj: ThreadChannel | ClientEvents): eventObj is ThreadChannel {
  const premise = eventObj as ThreadChannel;
  return premise.autoArchiveDuration != undefined;
}

function handleEvents(type: string, eventObject: ClientEvents) {

  const META: Meta = {
    isMod: false,
    fromGuild: false,
  };

  console.log(eventObject);

  // messageCommand
  if (isMessage(eventObject)) {
    const message = eventObject as Message;

    // abort if it's invoked by bots
    if (message.author.bot || message.author.id === message.client.user?.id) return;

    META.fromGuild = message.guildId !== null;
    META.isMod = message.member?.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS);
    const content = message.content.trim().split(/\s+/);
    META.commandArgs = content.slice(1);
    META.command = content[0];

    return messageRepo.delegate(META, message);
  }

  // reactCommand
  else if (isReact(eventObject)) {
    const react = eventObject as MessageReaction;

    // abort if it's invoked by the bot itself
    if (react.me) return;

    return reactionRepo.delegate(META, react);
  }

  // threadCommand
  else if (isThread(eventObject)) {
    const thread = eventObject as ThreadChannel;

    return threadRepo.delegate(META, thread);
  }
}

export default {
  handleEvents
};
