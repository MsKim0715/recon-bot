import { MatchService } from '../domain/match.service.js';
import { matchHubComponents, matchNoTeamComponents } from './match.components.js';

// /경기목록 허브 — getMyMatches(리더 스코프) + viewer 팀 id(승인 버튼 분기용)
export async function buildMatchHubPayload(
  matchService: MatchService,
  guildId: string,
  viewerDiscordId: string,
  page = 0,
) {
  const ctx = await matchService.getTeamMatchContext(viewerDiscordId, guildId);
  if (!ctx) return matchNoTeamComponents();
 
  return matchHubComponents(ctx.matches, ctx.teamId, ctx.isLeader, page);
}