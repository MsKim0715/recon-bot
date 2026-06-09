import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { COMMANDS } from '@/bot/constants/commands.js';
import { Handler } from '@/bot/routers/base.router.js';
import { RiotService } from '../domain/riot.service.js';
import { buildLinkModal } from './riot.modal-ui.js';

import { riotStatsComponents } from './riot.components.js';
import { handleError } from '@/shared/errors/handle-error.js';

export const riotLinkCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.VALORANT_LINK)
  .setDescription('Link your Riot account')
  .setNameLocalizations({ ko: '계정연동' })
  .setDescriptionLocalizations({ ko: 'Riot 계정을 연동합니다' });

export const riotViewCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.VALORANT_VIEW)
  .setDescription('View your Valorant stats') 
  .setNameLocalizations({ ko: '전적조회' })
  .setDescriptionLocalizations({ ko: '발로란트 전적을 조회합니다' });
  console.log("ee");

export class RiotCommand {
  constructor(private readonly riotService: RiotService) {}

  get link(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        await interaction.showModal(buildLinkModal());
      },
    };
  }

  get view(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          // defer 에는 Ephemeral 만. IsComponentsV2 는 editReply 쪽에 넣어야 적용됨
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const account = await this.riotService.getAccount(
            interaction.user.id,
            interaction.guildId!,
          );

          await interaction.editReply({
            components: [riotStatsComponents(interaction.user, account)],
            flags: MessageFlags.IsComponentsV2,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
}
