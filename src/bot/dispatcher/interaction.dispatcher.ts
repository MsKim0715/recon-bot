import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Router } from "../routers/base.router.js";
import { logger } from "@/infra/logger.js";

type DispatcherRouters = {
    command : Router<ChatInputCommandInteraction>,
    modal :  Router<ModalSubmitInteraction>
    button : Router<ButtonInteraction>,
   
}


export class InteractionDispatcher {
  constructor(
    private routers : DispatcherRouters
  ) {}

  async dispatch(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      logger.info(
        {
          command: interaction.commandName,
          userId: interaction.user.id,
          guildId: interaction.guildId,
        },
        "커맨드 실행",
      );
      return await this.routers.command.route(
        interaction.commandName,
        interaction,
      );
    }

    if (interaction.isButton()) {
      logger.info(
        {
          buttonId: interaction.customId,
          userId: interaction.user.id,
          
        },
        "버튼 클릭",
      );
      return await this.routers.button.route(
        interaction.customId,
        interaction,
      );
    }

    if (interaction.isModalSubmit()) {
      logger.info(
        {
          modalId: interaction.customId,
          userId: interaction.user.id,
          
        },
        "모달 제출",
      );
      return await this.routers.modal.route(
        interaction.customId,
        interaction,
      );
    }

  }
}
