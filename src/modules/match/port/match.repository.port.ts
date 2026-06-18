import type { Match } from "../domain/match.entity.js";

export interface TeamRef {
  id: string;
  name: string;
}

// 세트별 라운드 스코어
export interface SetScore {
  setNumber: number;
  homeScore: number; // 해당 세트 홈 팀 라운드 점수
  awayScore: number; // 해당 세트 원정 팀 라운드 점수
}

export interface MatchResultData {
  matchId: string;
  winnerId: string;
  loserId: string;
  homeSetsWon: number; // 홈 팀이 이긴 세트 수 (BO3: 0~2)
  awaySetsWon: number; // 원정 팀이 이긴 세트 수 (BO3: 0~2)
  submittedBy: string;
  createdAt: Date;
  sets: SetScore[];
}

export interface SubmitResultData {
  winnerId: string;
  loserId: string;
  homeSetsWon: number;
  awaySetsWon: number;
  submittedBy: string;
  sets: SetScore[];
}

export interface MatchView {
  id: string;
  scrimId: string;
  scrimNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: Date;
  status: string;
  result: MatchResultData | null;
}

export interface MatchRepositoryPort {
  findById(id: string): Promise<Match | null>;
  findViewById(id: string): Promise<MatchView | null>;
  findResult(matchId: string): Promise<MatchResultData | null>;
  findTeamByLeader(discordId: string, guildId: string): Promise<TeamRef | null>;
  findMatchesByTeam(teamId: string): Promise<MatchView[]>;

  // 결과 입력: MatchResult + MatchSet 생성 + Match 상태 ONGOING(승인 대기)
  submitResultTx(matchId: string, data: SubmitResultData): Promise<void>;
  // 승인: Match 상태 COMPLETED
  markCompleted(matchId: string): Promise<void>;
  // 거절: MatchResult 삭제(세트 cascade) + Match 상태 SCHEDULED(재입력 가능)
  rejectResultTx(matchId: string): Promise<void>;
  // 노쇼: Match 상태 NO_SHOW + 상대 팀 noShowCount +1
  noShowTx(matchId: string, penalizedTeamId: string): Promise<void>;

  findTeamOfMember(
    discordId: string,
    guildId: string,
  ): Promise<{ id: string; isLeader: boolean } | null>;
}
