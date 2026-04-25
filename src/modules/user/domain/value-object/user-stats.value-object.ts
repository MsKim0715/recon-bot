export class UserStats{
    constructor(
        public readonly currentTier: number,
        public readonly tierName : string,
        public readonly rr : number,
        public readonly winRate : number,
        public readonly kda : number,
        public readonly lastSyncedAt : Date,
    ) {}
}