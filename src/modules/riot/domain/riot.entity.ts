import { RiotRegion } from '@/modules/riot/domain/riot.types.js';

export class RiotAccount {
  constructor(
 
    public readonly puuid: string,
    public readonly gameName: string,
    public readonly tagLine: string,
    public readonly region: RiotRegion,
    public readonly currentTier: number | null = null,
    public readonly tierName: string | null = null,
    public readonly rr: number | null = null,
    public readonly winRate: number | null = null,
    public readonly kda: number | null = null,
    public readonly lastSyncedAt: Date | null = null,
  ) {}


}