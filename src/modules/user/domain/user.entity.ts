import { RiotRegion } from "@/shared/types/riot.types.js";
import { RiotAccount } from "./value-object/riot-account.value-object.js";
import { UserStats } from "./value-object/user-stats.value-object.js";

export class User {
  constructor(
    public readonly id: string,
    public readonly discordId: string,
    public readonly guildId: string,
    public readonly username: string,
    public readonly riotAccount: RiotAccount | null =null,
    public readonly stats: UserStats | null= null,
  ) {}

  isRiotLinked(): boolean {
    return this.riotAccount !== null;
  }

  canSync(): boolean {
    if (!this.stats?.lastSyncedAt) return true;
    const diff = Date.now() - this.stats?.lastSyncedAt.getTime();
    return diff > 1000 * 60 * 30;
  }

  linkRiotAccount(account: RiotAccount): User {
    return new User(
      this.id,
      this.discordId,
      this.guildId,
      this.username,
      account,
      this.stats,
    );
  }
}
