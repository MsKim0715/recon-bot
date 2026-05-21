import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { Handler } from "./routers/base.router.js";
import { CommandName, COMMANDS } from "./constants/commands.js";

import {
  pingCommandDef,
  pingCommand,
} from "@/modules/ping/adapters/ping.command.js";
import {
  userDeleteCommandDef,
  userRegisterCommandDef,
  userViewCommandDef,
} from "@/modules/user/adapters/user.command.js";
import { buildUserModule } from "./builders/user.builder.js";
import {
  teamCreateCommandDef,
  teamViewCommandDef,
  teamDisbandCommandDef,
  teamListCommandDef,
  teamJoinCommandDef,
  teamPendingCommandDef,
  teamKickCommandDef,
  teamLeaveCommandDef,
  teamTransferCommandDef,
  teamUpdateCommandDef,    
  teamCancelCommandDef,    
} from "@/modules/team/adapters/team.command.js";
import { buildTeamModule } from "./builders/team.builder.js";
import { MODALS } from "./constants/modals.js";
import { BUTTONS } from "./constants/buttons.js";
import {
  riotLinkCommandDef,
  riotViewCommandDef,
} from "@/modules/riot/adapter/riot.command.js";
import { buildRiotModule } from "./builders/riot.builder.js";

export type CommandEntry = {
  name: CommandName;
  def: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  handler: Handler<ChatInputCommandInteraction>;
};
export type AutocompleteEntry = {
  name : string, 
  handler : { handle(interaction: any): Promise<void> };
}


const userModule = buildUserModule();
const teamModule = buildTeamModule();
const riotModule = buildRiotModule();

export const commandEntries: CommandEntry[] = [
  // Ping
  { name: COMMANDS.PING, def: pingCommandDef, handler: pingCommand },

  // 회원
  { name: COMMANDS.MEMBER_REGISTER, def: userRegisterCommandDef, handler: userModule.command.register },
  { name: COMMANDS.MEMBER_VIEW,     def: userViewCommandDef,     handler: userModule.command.view },
  { name: COMMANDS.MEMBER_DELETE,   def: userDeleteCommandDef,   handler: userModule.command.delete },

  // 팀
  { name: COMMANDS.TEAM_CREATE,      def: teamCreateCommandDef,   handler: teamModule.command.create },
  { name: COMMANDS.TEAM_VIEW,        def: teamViewCommandDef,     handler: teamModule.command.view },
  { name: COMMANDS.TEAM_DISBAND,     def: teamDisbandCommandDef,  handler: teamModule.command.disband },
  { name: COMMANDS.TEAM_LIST,        def: teamListCommandDef,     handler: teamModule.command.list },
  { name: COMMANDS.TEAM_JOIN,        def: teamJoinCommandDef,     handler: teamModule.command.join },
  { name: COMMANDS.TEAM_APPLICATION, def: teamPendingCommandDef,  handler: teamModule.command.pending },
  { name: COMMANDS.TEAM_KICK,        def: teamKickCommandDef,     handler: teamModule.command.kick },
  { name: COMMANDS.TEAM_LEAVE,       def: teamLeaveCommandDef,    handler: teamModule.command.leave },
  { name: COMMANDS.TEAM_TRANSFER,    def: teamTransferCommandDef, handler: teamModule.command.transfer },
  { name: COMMANDS.TEAM_UPDATE,      def: teamUpdateCommandDef,   handler: teamModule.command.update },
  { name: COMMANDS.TEAM_CANCEL,      def: teamCancelCommandDef,   handler: teamModule.command.cancel },

  // 발로란트
  { name: COMMANDS.VALORANT_LINK, def: riotLinkCommandDef, handler: riotModule.command.link },
  { name: COMMANDS.VALORANT_VIEW, def: riotViewCommandDef, handler: riotModule.command.view },
];

export const modalEntries = [
  { id: MODALS.MEMBER_REGISTER, handler: userModule.modal.register },
  { id: MODALS.TEAM_CREATE, handler: teamModule.modal.create },
  { id: MODALS.TEAM_UPDATE, handler: teamModule.modal.update },
  { id: MODALS.VALORANT_LINK, handler: riotModule.modal.link },
];

export const buttonEntries = [
  { id: BUTTONS.TEAM_APPLICATION_ACCEPT, handler: teamModule.button.accept },
  { id: BUTTONS.TEAM_APPLICATION_REJECT, handler: teamModule.button.reject },
];

export const autocompleteEntries: AutocompleteEntry[] = [
  { name: COMMANDS.TEAM_KICK, handler: teamModule.command.kickAutocomplete },
];