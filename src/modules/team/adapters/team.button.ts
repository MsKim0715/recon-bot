import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { prisma } from '@/infra/database.js';
import { TeamService } from '../domain/team.service.js';
import { teamTransferredComponents } from './team.components.js';
import {
  buildTeamHubPayload,
  buildTeamBrowsePayload,
  buildMembersPayload,
  buildApplicationsPayload,
} from './team.hub.js';
import { buildTeamCreateModal, buildTeamUpdateModal } from './team.modal-ui.js';
import { handleError } from '@/shared/errors/handle-error.js';
import { NotFoundError } from '@/shared/errors/index.js';

export class TeamButton {
  constructor(private readonly teamService: TeamService) {}

  // [팀 목록] 페이지네이션 (button:team:list:<page>) — 목록 메시지 내에서 갱신
  get listPage(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const page = parseInt(interaction.customId.split(':')[3]);
          const { components } = await buildTeamBrowsePayload(
            this.teamService,
            interaction.guildId!,
            Number.isNaN(page) ? 0 : page,
          );
          await interaction.update({ components });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [팀 목록] 열기 (로비 → 새 ephemeral 목록)
  get openList(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const { components } = await buildTeamBrowsePayload(
            this.teamService,
            interaction.guildId!,
            0,
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

  // [팀 생성] → 생성 모달
  get openCreate(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        await interaction.showModal(buildTeamCreateModal());
      }
    };
  }

  // [팀 정보 수정] → 수정 모달 (현재 팀 정보 프리필)
  get openUpdate(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const detail = await this.teamService.findDetailByLeaderId(
            interaction.user.id,
            interaction.guildId!,
          );
          await interaction.showModal(buildTeamUpdateModal(detail.team));
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await handleError(interaction, e);
          }
        }
      }
    };
  }

  // [팀 해체] → 해체 후 허브 갱신(→ 로비)
  get disband(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          await this.teamService.disband(interaction.user.id, interaction.guildId!);
          const { components } = await buildTeamHubPayload(
            this.teamService,
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

  // [멤버 관리] → 멤버별 추방/위임 패널
  get members(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const { components } = await buildMembersPayload(
            this.teamService,
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

  // [가입 신청 목록]
  get pending(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const { components } = await buildApplicationsPayload(
            this.teamService,
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

  // [팀 탈퇴] → 탈퇴 후 허브 갱신(→ 로비)
  get leave(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          await this.teamService.leaveTeam(interaction.user.id, interaction.guildId!);
          const { components } = await buildTeamHubPayload(
            this.teamService,
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

  // [가입 신청] (button:team:joinopen:<teamId>)
  get join(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const teamId = interaction.customId.split(':')[3];
          const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { name: true },
          });
          if (!team) throw new NotFoundError('팀');

          await this.teamService.applyJoin(
            interaction.user.id,
            interaction.guildId!,
            team.name,
          );

          await interaction.reply({
            content: `${team.name} 팀에 가입 신청했습니다`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [추방] (button:team:kick:<targetDiscordId>) → 멤버 패널 갱신
  get kick(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const targetUserId = interaction.customId.split(':')[3];
          await this.teamService.kickMember(
            interaction.user.id,
            interaction.guildId!,
            targetUserId,
          );
          const { components } = await buildMembersPayload(
            this.teamService,
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

  // [위임] (button:team:transfer:<targetDiscordId>) → 본인은 리더 아님 → 패널을 결과로 교체
  get transfer(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const targetUserId = interaction.customId.split(':')[3];
          await this.teamService.transferLeader(
            interaction.user.id,
            interaction.guildId!,
            targetUserId,
          );

          const target = await prisma.user.findUnique({
            where: { discordId_guildId: { discordId: targetUserId, guildId: interaction.guildId! } },
            select: { username: true },
          });

          await interaction.update({
            components: [teamTransferredComponents(target?.username ?? '새 리더')],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  // [신청 취소] (button:team:unapply:<teamId>) → 로비 갱신
  get cancelApplication(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const teamId = interaction.customId.split(':')[3];
          const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { name: true },
          });
          if (!team) throw new NotFoundError('팀');

          await this.teamService.cancelApplication(
            interaction.user.id,
            interaction.guildId!,
            team.name,
          );

          const { components } = await buildTeamHubPayload(
            this.teamService,
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

  // 가입 수락 (button:team:application:accept:<applicantDiscordId>) → 신청 목록 갱신
  get accept(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const applicantId = interaction.customId.split(':')[4];
          await this.teamService.acceptApplication(
            interaction.user.id,
            interaction.guildId!,
            applicantId,
          );
          const { components } = await buildApplicationsPayload(
            this.teamService,
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

  // 가입 거절 → 신청 목록 갱신
  get reject(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const applicantId = interaction.customId.split(':')[4];
          await this.teamService.rejectApplication(
            interaction.user.id,
            interaction.guildId!,
            applicantId,
          );
          const { components } = await buildApplicationsPayload(
            this.teamService,
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
}