import { NotFoundError, ValidationError, PermissionError } from '@/shared/errors/index.js';
import { guardIsRegistered } from '@/shared/guards/index.js';
import { logger } from '@/infra/logger.js';
import { MatchRepositoryPort, MatchView } from '../port/match.repository.port.js';

// 다전제 경기에서 승리에 필요한 세트 수 (BO3=2, BO5=3)
const WINNING_SETS = 2;

export class MatchService {
  constructor(private readonly repo: MatchRepositoryPort) {}

  async getMyMatches(discordId: string, guildId: string): Promise<MatchView[]> {
    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) return [];
    return this.repo.findMatchesByTeam(team.id);
  }

  async getMatch(matchId: string): Promise<MatchView> {
    const view = await this.repo.findViewById(matchId);
    if (!view) throw new NotFoundError('경기');
    return view;
  }

  // 한 팀이 자기 관점의 세트별 라운드 스코어를 입력 → 세트 득실·승자 자동 계산 + 상대 승인 대기(ONGOING)
  async submitResult(
    discordId: string,
    guildId: string,
    matchId: string,
    sets: ReadonlyArray<{ myScore: number; opponentScore: number }>,
  ): Promise<void> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    const match = await this.repo.findById(matchId);
    if (!match) throw new NotFoundError('경기');

    if (!match.hasTeam(team.id)) {
      throw new PermissionError('경기에 참가한 팀의 리더만 결과를 입력할 수 있습니다');
    }

    if (match.isPendingApproval()) {
      throw new ValidationError('이미 입력된 결과가 있습니다. 상대 팀의 승인을 기다려주세요');
    }
    if (match.isCompleted()) {
      throw new ValidationError('이미 결과가 확정된 경기입니다');
    }
    if (!match.isScheduled()) {
      throw new ValidationError('결과를 입력할 수 없는 경기 상태입니다');
    }

    // 세트 수: 최소 WINNING_SETS(2:0) ~ 최대 WINNING_SETS*2-1(2:1)
    if (sets.length < WINNING_SETS || sets.length > WINNING_SETS * 2 - 1) {
      throw new ValidationError('BO3는 최소 2세트, 최대 3세트까지 입력할 수 있습니다');
    }

    for (const s of sets) {
      if (!Number.isInteger(s.myScore) || !Number.isInteger(s.opponentScore)) {
        throw new ValidationError('세트 점수는 정수여야 합니다');
      }
      if (s.myScore < 0 || s.opponentScore < 0) {
        throw new ValidationError('세트 점수는 0 이상이어야 합니다');
      }
      if (s.myScore === s.opponentScore) {
        throw new ValidationError('각 세트는 승패가 갈려야 합니다 (세트 동점 불가)');
      }
    }

    const series = match.buildSeries(team.id, sets);

    const winnerSets = Math.max(series.homeSetsWon, series.awaySetsWon);
    const loserSets = Math.min(series.homeSetsWon, series.awaySetsWon);
    if (winnerSets !== WINNING_SETS || loserSets >= WINNING_SETS) {
      throw new ValidationError('BO3는 한 팀이 2세트를 먼저 이겨야 합니다 (2:0 또는 2:1)');
    }

    const winnerId =
      series.homeSetsWon > series.awaySetsWon ? match.homeTeamId : match.awayTeamId;
    const loserId = winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

    // 클린치 이후 불필요한 세트 방지: 마지막 세트는 경기 승자가 이긴 세트여야 함
    const lastSet = series.sets[series.sets.length - 1];
    if (lastSet.winnerId !== winnerId) {
      throw new ValidationError('마지막 세트는 경기 승자가 이긴 세트여야 합니다');
    }

    await this.repo.submitResultTx(matchId, {
      winnerId,
      loserId,
      homeSetsWon: series.homeSetsWon,
      awaySetsWon: series.awaySetsWon,
      submittedBy: team.id,
      sets: series.sets.map((s) => ({
        setNumber: s.setNumber,
        homeScore: s.homeScore,
        awayScore: s.awayScore,
      })),
    });

    logger.info({ matchId, submittedBy: team.id }, '경기 결과 입력(승인 대기)');
  }

  // 상대 팀 리더가 승인 → 확정(COMPLETED)
  async approveResult(discordId: string, guildId: string, matchId: string): Promise<void> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    const match = await this.repo.findById(matchId);
    if (!match) throw new NotFoundError('경기');

    if (!match.hasTeam(team.id)) {
      throw new PermissionError('경기에 참가한 팀의 리더만 승인할 수 있습니다');
    }
    if (!match.isPendingApproval()) {
      throw new ValidationError('승인 대기 중인 결과가 없습니다');
    }

    const result = await this.repo.findResult(matchId);
    if (!result) throw new NotFoundError('입력된 결과');

    if (result.submittedBy === team.id) {
      throw new PermissionError('본인 팀이 입력한 결과는 승인할 수 없습니다');
    }

    await this.repo.markCompleted(matchId);

    logger.info({ matchId, approvedBy: team.id }, '경기 결과 확정');
  }

  // 상대 팀 리더가 거절 → 결과 삭제 후 재입력 가능(SCHEDULED)
  async rejectResult(discordId: string, guildId: string, matchId: string): Promise<void> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    const match = await this.repo.findById(matchId);
    if (!match) throw new NotFoundError('경기');

    if (!match.hasTeam(team.id)) {
      throw new PermissionError('경기에 참가한 팀의 리더만 거절할 수 있습니다');
    }
    if (!match.isPendingApproval()) {
      throw new ValidationError('승인 대기 중인 결과가 없습니다');
    }

    const result = await this.repo.findResult(matchId);
    if (!result) throw new NotFoundError('입력된 결과');

    if (result.submittedBy === team.id) {
      throw new PermissionError('본인 팀이 입력한 결과는 거절할 수 없습니다');
    }

    await this.repo.rejectResultTx(matchId);

    logger.info({ matchId, rejectedBy: team.id }, '경기 결과 거절(재입력 가능)');
  }

  // 참가 팀 리더가 상대 팀의 노쇼를 신고 → 상대 팀 noShowCount +1
  async reportNoShow(discordId: string, guildId: string, matchId: string): Promise<void> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    const match = await this.repo.findById(matchId);
    if (!match) throw new NotFoundError('경기');

    if (!match.hasTeam(team.id)) {
      throw new PermissionError('경기에 참가한 팀의 리더만 노쇼를 신고할 수 있습니다');
    }
    if (!match.isScheduled()) {
      throw new ValidationError('노쇼를 신고할 수 있는 경기 상태가 아닙니다');
    }
    if (match.scheduledAt.getTime() > Date.now()) {
      throw new ValidationError('경기 예정 시간 이전에는 노쇼를 신고할 수 없습니다');
    }

    const opponentId = match.opponentOf(team.id);
    if (!opponentId) throw new ValidationError('상대 팀을 찾을 수 없습니다');

    await this.repo.noShowTx(matchId, opponentId);

    logger.info(
      { matchId, reporter: team.id, penalized: opponentId },
      '노쇼 처리(상대 팀 노쇼 카운트 +1)',
    );
  }
}