import { prisma } from '@/infra/database.js';
import { MatchService } from '../domain/match.service.js';
import { matchHubComponents } from './match.components.js';

// /경기목록 허브 — getMyMatches(리더 스코프) + viewer 팀 id(승인 버튼 분기용)
export async function buildMatchHubPayload(
  matchService: MatchService,
  guildId: string,
  viewerDiscordId: string,
  page = 0,
) {
  const matches = await matchService.getMyMatches(viewerDiscordId, guildId);

  const myTeam = await prisma.team.findFirst({
    where: { leaderId: viewerDiscordId, guildId },
    select: { id: true },
  });

  return matchHubComponents(matches, myTeam?.id ?? null, page);
}