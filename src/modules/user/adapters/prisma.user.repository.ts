import { prisma } from "@/infra/database.js";
import { User } from "../domain/user.entity.js";
import { UserRepositoryPort } from "../ports/repository.port.js";
import { RiotAccount } from "../domain/value-object/riot-account.value-object.js";
import { UserStats } from "../domain/value-object/user-stats.value-object.js";
import { RiotRegion } from "@/shared/types/riot.types.js";
import { User as PrismaUser } from "@/generated/prisma/client.js";

export class PrismaUserRepository implements UserRepositoryPort {

  async findByDiscordId(discordId: string, guildId: string): Promise<User | null> {

    const data = await prisma.user.findUnique({
      where: { discordId_guildId: { discordId, guildId } },
    });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({
        where: {id}
    })
    if (!data) return null;
    return this.toEntity(data);
  }
  async save(user: User): Promise<void> {
    await prisma.user.upsert({
        where :{
            discordId_guildId : {
                discordId : user.discordId,
                guildId : user.guildId
            }
        },
        create : this.toPrisma(user),
        update : this.toPrisma(user),
    })
  }
  async update(discordId: string, guildId: string, user: User): Promise<void> {
    await prisma.user.update({
        where: { discordId_guildId : {discordId, guildId}},
        data : this.toPrisma(user),
    })
  }
  async delete(discordId: string, guildId: string): Promise<void> {
    await prisma.user.delete({
        where : {discordId_guildId : {discordId, guildId}}
    })
  }

  private toEntity(data: PrismaUser): User {
    const riotAccount = data.riotPuuid
      ? new RiotAccount(
          data.riotGameName!,
          data.riotTagLine!,
          data.riotPuuid,
          data.riotRegion as RiotRegion,
        )
      : null;
    
      const stats = data.currentTier
      ? new UserStats(
          data.currentTier,
          data.tierName!,
          data.rr!,
          data.winRate!,
          data.kda!,
          data.lastSyncedAt!,
        )
      : null;

      return new User(
      data.id,
      data.discordId,
      data.guildId,
      data.username,
      riotAccount,
      stats,
    )
  }

  private toPrisma(user: User) {
    return {
      id: user.id,
      discordId: user.discordId,
      guildId: user.guildId,
      username: user.username,
      riotGameName: user.riotAccount?.gameName ?? null,
      riotTagLine: user.riotAccount?.tag ?? null,
      riotPuuid: user.riotAccount?.puuid ?? null,
      riotRegion: user.riotAccount?.region ?? null,
      currentTier: user.stats?.currentTier ?? null,
      tierName: user.stats?.tierName ?? null,
      rr: user.stats?.rr ?? null,
      winRate: user.stats?.winRate ?? null,
      kda: user.stats?.kda ?? null,
      lastSyncedAt: user.stats?.lastSyncedAt ?? null,
    }
  }
}
