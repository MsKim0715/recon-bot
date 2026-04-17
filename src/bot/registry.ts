import { commandRouter } from './routers/command.router.js'
import { COMMANDS } from './constants/commands.js'
import { pingCommand } from '../modules/ping/adapters/ping.command.js'

export function registerAllCommands() {
  commandRouter.register(COMMANDS.PING, pingCommand)
}