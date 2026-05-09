

export class User {
  constructor(
    public readonly id: string,
    public readonly discordId: string,
    public readonly guildId: string,
    public readonly username: string,
    public readonly isLinked : boolean  = false,
    public readonly lastSyncedAt : Date | null = null,
    public readonly tierName : string | null = null,
    

  ) {}

   isRiotLinked(): boolean {
    return this.isLinked;
  }


  canSync(): boolean {
    if(!this.lastSyncedAt) return false;
    const diff = Date.now() - this.lastSyncedAt.getTime();
    return diff >1000 * 60 *30;
  }


}