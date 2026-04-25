// 조립만 담당 (Composition Root)
import { client } from './bot.client.js'
import { InteractionDispatcher } from '../dispatcher/interaction.dispatcher.js'
import { handleReady } from '../events/ready.js'
import { modules } from '../registry.js'
import { logger } from '@/infra/logger.js'
import { createInteractionHandler } from '../events/interactionCreate.js'
import { commandRouter } from '../routers/routers.js'


function registerCommands() {
  for (const module of modules) {
    commandRouter.register(module.name, module.handler)
    logger.debug({ name: module.name }, '커맨드 등록')
  }
}

function registerEvents() {
  const dispatcher = new InteractionDispatcher({
    command: commandRouter,
  })
  client.once('clientReady', (c) => handleReady(c))
  client.on('interactionCreate', createInteractionHandler(dispatcher))
}

export function setupBot() {
  registerCommands()
  registerEvents()
}