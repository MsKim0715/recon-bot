import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { Handler } from "./routers/base.router.js";
import { CommandName } from "./constants/commands.js";
import { ModalName } from "./constants/modals.js";
import { ButtonName } from "./constants/buttons.js";

export type CommandEntry = {
  name: CommandName;
  def: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  handler: Handler<ChatInputCommandInteraction>;
};

export type ModalEntry = {
  id: ModalName;
  handler: Handler<ModalSubmitInteraction>;
};

export type ButtonEntry = {
  id: ButtonName;
  handler: Handler<ButtonInteraction>;
};

export type AutocompleteEntry = {
  name: CommandName; // string → CommandName 으로 좁힘
  handler: Handler<AutocompleteInteraction>; // any 제거
};

export interface Scheduler {
  register(): void;
}

export interface DiscordModule {
  commands?: CommandEntry[];
  modals?: ModalEntry[];
  buttons?: ButtonEntry[];
  autocompletes?: AutocompleteEntry[];
  scheduler?: Scheduler;
}
