export interface RiotAccountInfo{
    puuid : string;
    gameName : string;
    tagLine : string;
    region : string;
}

export interface RiotRankInfo{
    currentTier: number;
    tierName : string;
    rr : number;
}

export interface RiotApiPort {
    fetchAccount(gameName : string, tagLine : string) : Promise<RiotAccountInfo>;
    fetchRank(puuid : string, region : string) : Promise<RiotRankInfo | null>;
}