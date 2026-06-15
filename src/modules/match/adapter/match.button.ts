import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { MatchService } from '../domain/match.service.js';
import {
  matchConfirmedComponents,
  matchRejectedComponents,
} from './match.components.js';
import { buildMatchHubPayload } from './match.hub.js';
import { buildMatchResultModal } from './match.modal-ui.js';
import { handleError } from '@/shared/errors/handle-error.js';

// 허브(ephemeral)에서 눌렀는지 / 공개 승인대기 메시지에서 눌렀는지 구분
function isFromHub(interaction: ButtonInteraction): boolean {
  return interaction.message.flags?.has(MessageFlags.Ephemeral) ?? false;
}

export class MatchButton {
  constructor(private readonly matchService: MatchService) {}

  // [결과 입력] (button:match:resultopen:<matchId>) → 결과 모달
  get resultOpen(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const matchId = interaction.customId.split(':')[3];
          await interaction.showModal(buildMatchResultModal(matchId));
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await handleError(interaction, e);
          }
        }
      },
    };
  }

  // [노쇼 신고] (button:match:noshow:<matchId>) → 허브 갱신
  get noShow(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const matchId = interaction.customId.split(':')[3];
          await this.matchService.reportNoShow(
            interaction.user.id,
            interaction.guildId!,
            matchId,
          );
          const { components } = await buildMatchHubPayload(
            this.matchService,
            interaction.guildId!,
            interaction.user.id,
            0,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }

  // 승인 — 허브에서면 허브 갱신, 공개 승인대기 메시지에서면 확정 카드로 교체
  get approve(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const matchId = interaction.customId.split(':')[3];
          await this.matchService.approveResult(
            interaction.user.id,
            interaction.guildId!,
            matchId,
          );

          if (isFromHub(interaction)) {
            const { components } = await buildMatchHubPayload(
              this.matchService,
              interaction.guildId!,
              interaction.user.id,
              0,
            );
            await interaction.update({ components });
          } else {
            const match = await this.matchService.getMatch(matchId);
            await interaction.update({ components: [matchConfirmedComponents(match)] });
          }
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }

  // 거절 — 허브에서면 허브 갱신(다시 SCHEDULED), 공개 메시지에서면 거절 카드
  get reject(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const matchId = interaction.customId.split(':')[3];
          await this.matchService.rejectResult(
            interaction.user.id,
            interaction.guildId!,
            matchId,
          );

          if (isFromHub(interaction)) {
            const { components } = await buildMatchHubPayload(
              this.matchService,
              interaction.guildId!,
              interaction.user.id,
              0,
            );
            await interaction.update({ components });
          } else {
            await interaction.update({ components: [matchRejectedComponents()] });
          }
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }

  // 허브 페이지네이션 (button:match:list:<page>)
  get listPage(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const page = parseInt(interaction.customId.split(':')[3]);
          const { components } = await buildMatchHubPayload(
            this.matchService,
            interaction.guildId!,
            interaction.user.id,
            Number.isNaN(page) ? 0 : page,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
}