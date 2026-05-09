export class Team {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly leaderId: string,
    public readonly guildId: string,
    public readonly description: string | null = null,
    public readonly noShowCount: number = 0,
  ) {}

  isLeader(userId: string): boolean {
    return this.leaderId === userId;
  }

  canApplyScrim(): boolean {
    return this.noShowCount < 3;
  }

  hasNoShowPenalty(): boolean {
    return this.noShowCount >= 3;
  }

  transferLeader(newLeaderId: string): Team {
    return new Team(
      this.id,
      this.name,
      newLeaderId,
      this.guildId,
      this.description,
      this.noShowCount,
    );
  }

  updateInfo(name: string, description: string | null): Team {
    return new Team(
      this.id,
      name,
      this.leaderId,
      this.guildId,
      description,
      this.noShowCount,
    );
  }

  incrementNoShow(): Team {
    return new Team(
      this.id,
      this.name,
      this.leaderId,
      this.guildId,
      this.description,
      this.noShowCount + 1,
    );
  }
}