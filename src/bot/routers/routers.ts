import {
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction
} from 'discord.js'
import { Router } from './base.router.js'

export const commandRouter = new Router<ChatInputCommandInteraction>()
export const buttonRouter = new Router<ButtonInteraction>()
export const modalRouter = new Router<ModalSubmitInteraction>()