import { MessageReaction } from "discord.js";
import { Meta } from "./interfaces";

function delegate(META: Meta, react: MessageReaction) {

  const _react = react.emoji.name;

  switch (_react) {
    default:
      break;
  }
}

export default { delegate };
