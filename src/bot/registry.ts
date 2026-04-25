import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { Handler } from './routers/base.router.js'
import { CommandName, COMMANDS } from './constants/commands.js'

import { pingCommandDef, pingCommand } from '@/modules/ping/adapters/ping.command.js'

export type CommandEntry = {
  name: CommandName
  def: SlashCommandBuilder
  handler: Handler<ChatInputCommandInteraction>
}

export const modules: CommandEntry[] = [
  { name: COMMANDS.PING, def: pingCommandDef, handler: pingCommand },
]