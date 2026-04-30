// 조립만 담당 (Composition Root)
import { client } from './bot.client.js'
import { InteractionDispatcher } from '../dispatcher/interaction.dispatcher.js'
import { handleReady } from '../events/ready.js'
import { commandEntries, modalEntries } from '../registry.js'
import { logger } from '@/infra/logger.js'
import { createInteractionHandler } from '../events/interactionCreate.js'
import { buttonRouter, commandRouter, modalRouter } from '../routers/routers.js'



function registerCommands() {
  for (const module of commandEntries) {
    commandRouter.register(module.name, module.handler)
    logger.debug({ name: module.name }, '커맨드 등록')
  }
}
function registerModals(){
  for (const entry of modalEntries) {
    modalRouter.register(entry.id, entry.handler)
    logger.debug({ id: entry.id }, '모달 등록')
  }
}

function registerEvents() {
  const dispatcher = new InteractionDispatcher({
    command: commandRouter,
    modal : modalRouter,
    button : buttonRouter,
  })
  client.once('clientReady', (c) => handleReady(c))
  client.on('interactionCreate', createInteractionHandler(dispatcher))
}

export function setupBot() {
  registerCommands();
  registerModals();
  registerEvents();
}