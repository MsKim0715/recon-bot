export class TeamStats {
    constructor(
        public readonly avgTier : number,
        public readonly avgTierName : string,
        public readonly avgWinRate : number,
        public readonly avgKda : number,
    ) {}
}