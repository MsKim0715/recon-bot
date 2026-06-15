export interface RiotAccountInfo {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
}

export interface RiotRankInfo {
  currentTier: number;
  tierName: string;
  rr: number;
}

export interface RiotStatsInfo {
  kda: number;
  winRate: number;
  matchCount: number;
}

export interface RiotApiPort {
  fetchAccount(gameName: string, tagLine: string): Promise<RiotAccountInfo>;
  fetchRank(puuid: string, region: string): Promise<RiotRankInfo | null>;
  fetchRecentStats(
    puuid: string,
    region: string,
  ): Promise<RiotStatsInfo | null>; 
}
