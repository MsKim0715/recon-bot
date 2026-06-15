import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { RiotService } from '../domain/riot.service.js';
import { riotLinkSuccessComponents } from './riot.components.js';
import { handleError } from '@/shared/errors/handle-error.js';


export class RiotModal {
  constructor(private readonly riotService: RiotService) {}

  get link(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          const gameName = interaction.fields.getTextInputValue('gameName');
          const tagLine = interaction.fields.getTextInputValue('tagLine');

          // 연동은 Henrik API를 여러 번 호출하므로 defer (Ephemeral 만)
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const account = await this.riotService.linkAccount(
            interaction.user.id,
            interaction.guildId!,
            gameName,
            tagLine,
          );


          await interaction.editReply({
            components: [riotLinkSuccessComponents(interaction.user, account)],
            flags: MessageFlags.IsComponentsV2,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
}
