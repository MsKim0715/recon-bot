import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { RiotService } from '../domain/riot.service.js';
import { riotLinkSuccessEmbed } from './riot.embed.js';
import { handleError } from '@/shared/errors/handle-error.js';

export class RiotModal {
  constructor(private readonly riotService: RiotService) {}

  get link(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          const gameName = interaction.fields.getTextInputValue('gameName');
          const tagLine = interaction.fields.getTextInputValue('tagLine');

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const account = await this.riotService.linkAccount(
            interaction.user.id,
            interaction.guildId!,
            gameName,
            tagLine,
          );

          await interaction.editReply({
            embeds: [riotLinkSuccessEmbed(interaction.user, account)],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }
}