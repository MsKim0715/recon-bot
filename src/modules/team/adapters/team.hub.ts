import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { prisma } from '@/infra/database.js';
import { BUTTONS } from '@/bot/constants/buttons.js';
import { TeamService } from '../domain/team.service.js';
import {
  teamHubComponents,
  teamLobbyComponents,
  teamMembersComponents,
  teamJoinListComponents,
  teamApplicationsComponents,
} from './team.components.js';

// /팀 허브 — viewer 역할(리더/멤버/무소속)에 따라 다른 화면.
// 도메인/레포 변경 없이 어댑터에서 prisma 로 멤버십을 판별한다.
export async function buildTeamHubPayload(
  teamService: TeamService,
  guildId: string,
  viewerDiscordId: string,
) {
  // 1) 리더?
  const ownTeam = await prisma.team.findFirst({
    where: { leaderId: viewerDiscordId, guildId },
    select: { id: true },
  });
  if (ownTeam) {
    const detail = await teamService.findDetailByLeaderId(viewerDiscordId, guildId);
    return teamHubComponents(detail, 'LEADER');
  }

  // 2) 멤버? (멤버십에서 팀의 leaderId 를 얻어 기존 detail 조회 재사용)
  const membership = await prisma.teamMember.findFirst({
    where: { user: { discordId: viewerDiscordId, guildId }, team: { guildId } },
    select: { team: { select: { leaderId: true } } },
  });
  if (membership?.team) {
    const detail = await teamService.findDetailByLeaderId(membership.team.leaderId, guildId);
    return teamHubComponents(detail, 'MEMBER');
  }

  // 3) 무소속 → 로비 + 내 가입 신청(PENDING)
  const apps = await prisma.teamApplication.findMany({
    where: { user: { discordId: viewerDiscordId, guildId }, status: 'PENDING' },
    select: { teamId: true, createdAt: true, team: { select: { name: true } } },
  });
  const myApps = apps.map(a => ({
    teamId: a.teamId,
    teamName: a.team?.name ?? '알 수 없음',
    createdAt: a.createdAt,
  }));
  return teamLobbyComponents(myApps);
}

// [팀 목록] — 각 카드 [가입 신청]
export async function buildTeamBrowsePayload(
  teamService: TeamService,
  guildId: string,
  page: number = 0,
) {
  const teams = await teamService.findAllByGuildId(guildId);
  return teamJoinListComponents(teams, page);
}

// [멤버 관리]
export async function buildMembersPayload(
  teamService: TeamService,
  guildId: string,
  leaderDiscordId: string,
) {
  const detail = await teamService.findDetailByLeaderId(leaderDiscordId, guildId);
  return teamMembersComponents(detail.members, leaderDiscordId, detail.team.name);
}

// [가입 신청 목록] — container + 신청자별 수락/거절 row
export async function buildApplicationsPayload(
  teamService: TeamService,
  guildId: string,
  leaderDiscordId: string,
) {
  const applications = await teamService.getPendingApplications(leaderDiscordId, guildId);

  const rows = applications.map(app =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${BUTTONS.TEAM_APPLICATION_ACCEPT}:${app.userId}`)
        .setLabel('수락')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`${BUTTONS.TEAM_APPLICATION_REJECT}:${app.userId}`)
        .setLabel('거절')
        .setStyle(ButtonStyle.Danger),
    ),
  );

  return { components: [teamApplicationsComponents(applications), ...rows] };
}