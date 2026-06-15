import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { ScrimService } from '../domain/scrim.service.js';
import {
  scrimCreatedComponents,
  scrimApplicationNotificationComponents,
} from './scrim.components.js';
import { handleError } from '@/shared/errors/handle-error.js';
import { prisma } from '@/infra/database.js';
import { ValidationError } from '@/shared/errors/index.js';
import { logger } from '@/infra/logger.js';

export class ScrimModal {
  constructor(private readonly scrimService: ScrimService) {}

  get create(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          const date = interaction.fields.getTextInputValue('date');
          const time = interaction.fields.getTextInputValue('time');
          const description = interaction.fields.getTextInputValue('description') || null;
          const minTierStr = interaction.fields.getTextInputValue('minTier') || null;
          const maxTierStr = interaction.fields.getTextInputValue('maxTier') || null;

          //  날짜/시간 합쳐서 파싱
          const scheduledAt = new Date(`${date}T${time}:00`);
          if (isNaN(scheduledAt.getTime())) {
            throw new ValidationError('올바른 날짜/시간 형식을 입력해주세요');
          }

          const minTier = minTierStr ? parseInt(minTierStr) : null;
          const maxTier = maxTierStr ? parseInt(maxTierStr) : null;

          if (minTier !== null && maxTier !== null && minTier > maxTier) {
            throw new ValidationError('최소 티어가 최대 티어보다 클 수 없습니다');
          }

          const scrim = await this.scrimService.createScrim(
            interaction.user.id,
            interaction.guildId!,
            scheduledAt,
            description,
            minTier,
            maxTier,
          );

          const team = await prisma.team.findUnique({
            where: { id: scrim.teamId }
          });

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [scrimCreatedComponents(scrim, team?.name ?? '알 수 없음')],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get apply(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          //  customId: modal:scrim:apply:scrimNumber
          const scrimNumber = parseInt(interaction.customId.split(':')[3]);
          const message = interaction.fields.getTextInputValue('message') || null;

          await this.scrimService.applyScrim(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
            message,
          );

          await interaction.reply({
            content: '스크림 신청이 완료됐습니다',
            flags: MessageFlags.Ephemeral
          });

          // 모집팀 리더에게 DM 알림 — 실패해도 신청 자체는 유효하므로 막지 않음
          await this.notifyRecruiter(interaction, scrimNumber).catch(err =>
            logger.warn(err, '스크림 신청 알림 DM 실패')
          );
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // 신청 성공 직후 모집팀 리더에게 DM 으로 수락/거절 버튼을 보낸다.
  private async notifyRecruiter(
    interaction: ModalSubmitInteraction,
    scrimNumber: number,
  ): Promise<void> {
    const guildId = interaction.guildId!;
    const scrim = await this.scrimService.getScrimByNumber(scrimNumber, guildId);

    const [recruitingTeam, applicantTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: scrim.teamId },
        select: { name: true, leaderId: true },
      }),
      prisma.team.findFirst({
        where: { leaderId: interaction.user.id, guildId },
        select: { id: true, name: true },
      }),
    ]);

    if (!recruitingTeam?.leaderId || !applicantTeam) return;

    const leader = await interaction.client.users.fetch(recruitingTeam.leaderId);
    await leader.send({
      flags: MessageFlags.IsComponentsV2,
      components: [
        scrimApplicationNotificationComponents(
          scrim,
          recruitingTeam.name,
          applicantTeam.name,
          applicantTeam.id,
          guildId,
        ),
      ],
    });
  }
}