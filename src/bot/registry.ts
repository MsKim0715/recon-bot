import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { Handler } from './routers/base.router.js'
import { CommandName, COMMANDS } from './constants/commands.js'

import { pingCommandDef, pingCommand } from '@/modules/ping/adapters/ping.command.js'
import { userDeleteCommandDef, userRegisterCommandDef, userViewCommandDef } from '@/modules/user/adapters/user.command.js'
import { buildUserModule } from './builders/user.builder.js'
import { teamCreateCommandDef, teamViewCommandDef } from '@/modules/team/adapters/team.command.js'
import { buildTeamModule } from './builders/team.builder.js'
import { MODALS } from './constants/modals.js'

export type CommandEntry = {
  name: CommandName
  def: SlashCommandBuilder
  handler: Handler<ChatInputCommandInteraction>
}

const userModule = buildUserModule();
const teamModule = buildTeamModule();


export const commandEntries: CommandEntry[] = [
  { name: COMMANDS.PING, def: pingCommandDef, handler: pingCommand },
  { name: COMMANDS.MEMBER_REGISTER, def: userRegisterCommandDef, handler: userModule.command.register },
  { name: COMMANDS.MEMBER_VIEW, def: userViewCommandDef, handler: userModule.command.view },
  { name: COMMANDS.MEMBER_DELETE, def: userDeleteCommandDef, handler: userModule.command.delete },
  { name : COMMANDS.TEAM_CREATE, def : teamCreateCommandDef, handler : teamModule.command.create},
  { name : COMMANDS.TEAM_VIEW, def : teamViewCommandDef, handler : teamModule.command.view}
]

export const modalEntries = [
  {id : MODALS.MEMBER_REGISTER, handler : userModule.modal.register},
  {id : MODALS.TEAM_CREATE, handler : teamModule.modal.create},
]