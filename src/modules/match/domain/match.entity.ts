export type MatchStatus =
  | 'SCHEDULED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export class Match {
  constructor(
    public readonly id: string,
    public readonly scrimId: string,
    public readonly homeTeamId: string,
    public readonly awayTeamId: string,
    public readonly scheduledAt: Date,
    public readonly status: MatchStatus = 'SCHEDULED',
  ) {}

  hasTeam(teamId: string): boolean {
    return this.homeTeamId === teamId || this.awayTeamId === teamId;
  }

  isHome(teamId: string): boolean {
    return this.homeTeamId === teamId;
  }

  opponentOf(teamId: string): string | null {
    if (this.homeTeamId === teamId) return this.awayTeamId;
    if (this.awayTeamId === teamId) return this.homeTeamId;
    return null;
  }

  isScheduled(): boolean {
    return this.status === 'SCHEDULED';
  }

  // 결과 입력 후 상대 승인 대기 상태
  isPendingApproval(): boolean {
    return this.status === 'ONGOING';
  }

  isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  isNoShow(): boolean {
    return this.status === 'NO_SHOW';
  }

  isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }

  // 입력한 팀(submitter) 관점의 세트별 라운드 스코어를 home/away 로 정규화하고,
  // 세트별 승자 + 세트 득실(이긴 세트 수)을 계산한다.
  // 세트 동점은 winnerId=null 로 두고 세트 수에 포함하지 않는다(서비스에서 사전 검증).
  buildSeries(
    submitterTeamId: string,
    sets: ReadonlyArray<{ myScore: number; opponentScore: number }>,
  ): {
    sets: Array<{ setNumber: number; homeScore: number; awayScore: number; winnerId: string | null }>;
    homeSetsWon: number;
    awaySetsWon: number;
  } {
    const home = this.isHome(submitterTeamId);
    let homeSetsWon = 0;
    let awaySetsWon = 0;

    const mapped = sets.map((s, i) => {
      const homeScore = home ? s.myScore : s.opponentScore;
      const awayScore = home ? s.opponentScore : s.myScore;

      let winnerId: string | null = null;
      if (homeScore > awayScore) {
        winnerId = this.homeTeamId;
        homeSetsWon += 1;
      } else if (awayScore > homeScore) {
        winnerId = this.awayTeamId;
        awaySetsWon += 1;
      }

      return { setNumber: i + 1, homeScore, awayScore, winnerId };
    });

    return { sets: mapped, homeSetsWon, awaySetsWon };
  }
}