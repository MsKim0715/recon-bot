import { prisma } from '@/infra/database.js';
import { ScrimService } from '../domain/scrim.service.js';
import {
  scrimHubComponents,
  scrimMyApplicationsComponents,
} from './scrim.components.js';

// 팀 id → 팀 이름 맵을 만든다 (목록 카드 표시용)
async function buildTeamNames(teamIds: string[]): Promise<Record<string, string>> {
  if (teamIds.length === 0) return {};
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
  return Object.fromEntries(teams.map(t => [t.id, t.name]));
}

// /스크림목록 허브 페이로드. viewer 가 리더인 팀 기준으로 "내 글/남의 글" 버튼이 갈린다.
export async function buildScrimHubPayload(
  scrimService: ScrimService,
  guildId: string,
  viewerDiscordId: string,
  page: number = 0,
) {
  const scrims = await scrimService.getOpenScrims(guildId);
  const teamNames = await buildTeamNames([...new Set(scrims.map(s => s.teamId))]);

  const myTeam = await prisma.team.findFirst({
    where: { leaderId: viewerDiscordId, guildId },
    select: { id: true },
  });

  return scrimHubComponents(scrims, teamNames, myTeam?.id ?? null, page);
}

// [내 신청] 페이로드
export async function buildMyApplicationsPayload(
  scrimService: ScrimService,
  guildId: string,
  viewerDiscordId: string,
) {
  const scrims = await scrimService.getMyApplicationScrims(viewerDiscordId, guildId);
  const teamNames = await buildTeamNames([...new Set(scrims.map(s => s.teamId))]);
  return scrimMyApplicationsComponents(scrims, teamNames);
}