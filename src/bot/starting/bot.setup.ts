// 조립만 담당 (Composition Root)
import { client } from "./bot.client.js";
import { InteractionDispatcher } from "../dispatcher/interaction.dispatcher.js";
import { handleReady } from "../events/ready.js";
import { handleGuildMemberAdd } from "../events/guildMemberAdd.js";
import {
  autocompleteEntries,
  buttonEntries,
  commandEntries,
  modalEntries,
} from "../registry.js";
import { logger } from "@/infra/logger.js";
import { createInteractionHandler } from "../events/interactionCreate.js";
import {
  autocompleteRouter,
  buttonRouter,
  commandRouter,
  modalRouter,
} from "../routers/routers.js";

function registerCommands() {
  for (const module of commandEntries) {
    commandRouter.register(module.name, module.handler);
    logger.debug({ name: module.name }, "커맨드 등록");
  }
}
function registerModals() {
  for (const entry of modalEntries) {
    modalRouter.register(entry.id, entry.handler);
    logger.debug({ id: entry.id }, "모달 등록");
  }
}
function registerButtons() {
  for (const entry of buttonEntries) {
    buttonRouter.register(entry.id, entry.handler);
    logger.debug({ id: entry.id }, "버튼 등록");
  }
}

function registerAutoCompletes() {
  for (const entry of autocompleteEntries) {
    autocompleteRouter.register(entry.name, entry.handler);
  }
}

function registerEvents() {
  const dispatcher = new InteractionDispatcher({
    command: commandRouter,
    modal: modalRouter,
    button: buttonRouter,
    autocomplete: autocompleteRouter,
  });
  client.once("clientReady", (c) => handleReady(c));
  client.on("interactionCreate", createInteractionHandler(dispatcher));
  client.on("guildMemberAdd", (member) => handleGuildMemberAdd(member));
}

export function setupBot() {
  registerCommands();
  registerModals();
  registerButtons();
  registerAutoCompletes();
  registerEvents();
}