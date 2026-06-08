export type ScrimStatus = 'OPEN' | 'MATCHED' | 'CLOSED' | 'CANCELLED';

export class Scrim {
  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly teamId: string,
    public readonly guildId: string,
    public readonly scheduledAt: Date,
    public readonly description: string | null = null,
    public readonly minTier: number | null = null,
    public readonly maxTier: number | null = null,
    public readonly status: ScrimStatus = 'OPEN',
  ) {}


  hasTierLimit(): boolean {
    return this.minTier !== null && this.maxTier !== null;
  }


  isInTierRange(avgTier: number): boolean {
    if (!this.hasTierLimit()) return true;
    return avgTier >= this.minTier! && avgTier <= this.maxTier!;
  }


  canApply(): boolean {
    return this.status === 'OPEN';
  }


  cancel(): Scrim {
    return new Scrim(
      this.id,
      this.number,
      this.teamId,
      this.guildId,
      this.scheduledAt,
      this.description,
      this.minTier,
      this.maxTier,
      'CANCELLED',
    );
  }


  close(): Scrim {
    return new Scrim(
      this.id,
      this.number,
      this.teamId,
      this.guildId,
      this.scheduledAt,
      this.description,
      this.minTier,
      this.maxTier,
      'CLOSED',
    );
  }


  match(): Scrim {
    return new Scrim(
      this.id,
      this.number,
      this.teamId,
      this.guildId,
      this.scheduledAt,
      this.description,
      this.minTier,
      this.maxTier,
      'MATCHED',
    );
  }
}