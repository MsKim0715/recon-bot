import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { ScrimService } from '../domain/scrim.service.js';
import {
  scrimApplicationsComponents,
  scrimNotificationResultComponents,
  scrimMatchedNotificationComponents,
} from './scrim.components.js';
import { buildScrimHubPayload, buildMyApplicationsPayload } from './scrim.hub.js';
import { buildScrimCreateModal, buildScrimApplyModal } from './scrim.modal-ui.js';
import { handleError } from '@/shared/errors/handle-error.js';
import { ValidationError } from '@/shared/errors/index.js';
import { prisma } from '@/infra/database.js';
import { logger } from '@/infra/logger.js';

export class ScrimButton {
  constructor(private readonly scrimService: ScrimService) {}

  // 허브 페이지네이션 (button:scrim:list:<page>)
  get listPage(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const page = parseInt(interaction.customId.split(':')[3]);
          const { components } = await buildScrimHubPayload(
            this.scrimService,
            interaction.guildId!,
            interaction.user.id,
            Number.isNaN(page) ? 0 : page,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [스크림 모집] → 생성 모달
  get openCreate(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        await interaction.showModal(buildScrimCreateModal());
      }
    };
  }

  // [신청] → 신청 모달 (button:scrim:applyopen:<number>)
  get openApply(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.customId.split(':')[3]);
          await interaction.showModal(buildScrimApplyModal(scrimNumber));
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await handleError(interaction, e);
          }
        }
      }
    };
  }

  // [신청 목록] → 신청자 목록(수락/거절) (button:scrim:applist:<number>)
  get applications(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.customId.split(':')[3]);
          const applications = await this.scrimService.getApplications(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );
          const scrim = await this.scrimService.getScrimByNumber(scrimNumber, interaction.guildId!);
          const { container, rows } = scrimApplicationsComponents(applications, scrim.id);

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container, ...rows],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [마감] (button:scrim:close:<number>) → 마감 후 허브 갱신
  get close(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.customId.split(':')[3]);
          await this.scrimService.closeScrim(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );
          const { components } = await buildScrimHubPayload(
            this.scrimService,
            interaction.guildId!,
            interaction.user.id,
            0,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [취소] 모집글 취소 (button:scrim:cancel:<number>) → 취소 후 허브 갱신
  get cancel(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.customId.split(':')[3]);
          await this.scrimService.cancelScrim(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );
          const { components } = await buildScrimHubPayload(
            this.scrimService,
            interaction.guildId!,
            interaction.user.id,
            0,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [내 신청] (button:scrim:myapps)
  get myApplications(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const { components } = await buildMyApplicationsPayload(
            this.scrimService,
            interaction.guildId!,
            interaction.user.id,
          );
          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [신청 취소] (button:scrim:unapply:<number>) → 취소 후 내 신청 목록 갱신
  get cancelApplication(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.customId.split(':')[3]);
          await this.scrimService.cancelApplication(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );
          const { components } = await buildMyApplicationsPayload(
            this.scrimService,
            interaction.guildId!,
            interaction.user.id,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // 수락 — 길드 목록 또는 DM 알림 양쪽에서 동작
  // 길드: button:scrim:accept:<scrimId>:<applicantTeamId>
  // DM  : button:scrim:accept:<scrimId>:<applicantTeamId>:<guildId>
  get accept(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const parts = interaction.customId.split(':');
          const scrimId = parts[3];
          const applicantTeamId = parts[4];
          const guildId = interaction.guildId ?? parts[5];
          if (!guildId) throw new ValidationError('길드 정보를 찾을 수 없습니다');

          await this.scrimService.acceptApplication(
            interaction.user.id,
            guildId,
            scrimId,
            applicantTeamId,
          );

          // 수락 시 Match 가 생성됨(acceptApplicationTx) → 신청팀 리더에게 "경기 잡힘" DM.
          // 실패해도 수락 자체는 유효하므로 막지 않음.
          await this.notifyMatchScheduled(interaction, scrimId, applicantTeamId).catch(err =>
            logger.warn(err, '경기 생성 알림 DM 실패'),
          );

          if (interaction.inGuild()) {
            await interaction.reply({
              content: '신청 수락 완료 — 경기가 잡혔습니다 (`/경기목록`에서 확인)',
              flags: MessageFlags.Ephemeral,
            });
          } else {
            // DM 알림에서 누른 경우 → 메시지 갱신(버튼 제거)
            await interaction.update({
              components: [scrimNotificationResultComponents('수락')],
            });
          }
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get reject(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const parts = interaction.customId.split(':');
          const scrimId = parts[3];
          const applicantTeamId = parts[4];
          const guildId = interaction.guildId ?? parts[5];
          if (!guildId) throw new ValidationError('길드 정보를 찾을 수 없습니다');

          await this.scrimService.rejectApplication(
            interaction.user.id,
            guildId,
            scrimId,
            applicantTeamId,
          );

          if (interaction.inGuild()) {
            await interaction.reply({
              content: '스크림 신청을 거절했습니다',
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.update({
              components: [scrimNotificationResultComponents('거절')],
            });
          }
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // 수락 직후 신청팀(=away) 리더에게 경기 일정 DM
  private async notifyMatchScheduled(
    interaction: ButtonInteraction,
    scrimId: string,
    applicantTeamId: string,
  ): Promise<void> {
    const [scrim, applicant] = await Promise.all([
      prisma.scrim.findUnique({
        where: { id: scrimId },
        select: { number: true, scheduledAt: true, team: { select: { name: true } } },
      }),
      prisma.team.findUnique({
        where: { id: applicantTeamId },
        select: { name: true, leaderId: true },
      }),
    ]);

    if (!scrim?.team || !applicant) return;

    const leader = await interaction.client.users.fetch(applicant.leaderId);
    await leader.send({
      flags: MessageFlags.IsComponentsV2,
      components: [
        scrimMatchedNotificationComponents(
          scrim.number,
          scrim.team.name,
          applicant.name,
          scrim.scheduledAt,
        ),
      ],
    });
  }
}