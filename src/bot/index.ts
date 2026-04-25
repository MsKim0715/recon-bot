import { client } from './starting/bot.client.js'
import { setupBot } from './starting/bot.setup.js'
import { deployCommands } from './deploy-commands.js'
import { env } from '@/env.js'

export async function startBot() {
  setupBot()
  await deployCommands()
  await client.login(env.DISCORD_TOKEN)
}