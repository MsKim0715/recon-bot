import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { MatchService } from '../domain/match.service.js';

import { handleError } from '@/shared/errors/handle-error.js';
import { ValidationError } from '@/shared/errors/index.js';
import { matchPendingComponents } from './match.components.js';

// 빈 선택 필드는 Discord 가 제출에서 누락할 수 있어 안전하게 읽음
function safeField(interaction: ModalSubmitInteraction, id: string): string {
  try {
    return interaction.fields.getTextInputValue(id);
  } catch {
    return '';
  }
}

// "13:7" / "13-7" / "13 7" → { myScore, opponentScore }, 빈 값이면 null
function parseSet(raw: string): { myScore: number; opponentScore: number } | null {
  const v = raw.trim();
  if (!v) return null;

  const parts = v.split(/[:\-\s]+/).filter(Boolean);
  if (parts.length !== 2) {
    throw new ValidationError('세트 점수는 "13:7" 형식으로 입력해주세요');
  }

  const my = Number(parts[0]);
  const opp = Number(parts[1]);
  if (!Number.isInteger(my) || !Number.isInteger(opp)) {
    throw new ValidationError('세트 점수는 숫자여야 합니다');
  }

  return { myScore: my, opponentScore: opp };
}

export class MatchModal {
  constructor(private readonly matchService: MatchService) {}

  get result(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          // customId: modal:match:result:{matchId}
          const matchId = interaction.customId.split(':')[3];

          const sets = [
            parseSet(safeField(interaction, 'set1')),
            parseSet(safeField(interaction, 'set2')),
            parseSet(safeField(interaction, 'set3')),
          ].filter(
            (s): s is { myScore: number; opponentScore: number } => s !== null,
          );

          await this.matchService.submitResult(
            interaction.user.id,
            interaction.guildId!,
            matchId,
            sets,
          );

          const match = await this.matchService.getMatch(matchId);
          const { container, row } = matchPendingComponents(match);

          // 상대 팀 리더가 보고 승인/거절할 수 있도록 공개 메시지로 전송
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container, row],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
}