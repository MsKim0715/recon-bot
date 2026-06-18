import { RiotAccount } from "../domain/riot.entity.js";
import { RiotRepositoryPort } from "../ports/riot.repository.port.js";
import { RiotRegion } from "@/generated/prisma/index.js";
import { prisma } from "@/infra/database.js";
import { RiotAccount as PrismaRiotAccount } from "@/generated/prisma/index.js";

export class PrismaRiotRepository implements RiotRepositoryPort {
  async findAllWithUserIds(): Promise<
    { userId: string; account: RiotAccount }[]
  > {
    const rows = await prisma.riotAccount.findMany();
    return rows.map((r) => ({ userId: r.userId, account: this.toEntity(r) }));
  }

  async findByUserId(userId: string): Promise<RiotAccount | null> {
    const data = await prisma.riotAccount.findUnique({ where: { userId } });
    if (!data) return null;
    return this.toEntity(data);
  }
  async findByPuuid(puuid: string): Promise<RiotAccount | null> {
    const data = await prisma.riotAccount.findUnique({ where: { puuid } });
    if (!data) return null;
    return this.toEntity(data);
  }
  async save(userId: string, account: RiotAccount): Promise<void> {
    await prisma.riotAccount.create({
      data: {
        userId,
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
        region: account.region,
        currentTier: account.currentTier,
        tierName: account.tierName,
        rr: account.rr,
        winRate: account.winRate,
        kda: account.kda,
        lastSyncedAt: account.lastSyncedAt,
      },
    });
  }
  async update(userId: string, account: RiotAccount): Promise<void> {
    await prisma.riotAccount.update({
      where: { userId },
      data: {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
        region: account.region,
        currentTier: account.currentTier,
        tierName: account.tierName,
        rr: account.rr,
        winRate: account.winRate,
        kda: account.kda,
        lastSyncedAt: account.lastSyncedAt,
      },
    });
  }
  async delete(userId: string): Promise<void> {
    await prisma.riotAccount.delete({ where: { userId } });
  }

  async resolveUserId(
    discordId: string,
    guildId: string,
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { discordId_guildId: { discordId, guildId } },
      select: { id: true },
    });
    return user?.id ?? null;
  }
  private toEntity(data: PrismaRiotAccount): RiotAccount {
    return new RiotAccount(
      data.puuid,
      data.gameName,
      data.tagLine,
      data.region as RiotRegion,
      data.currentTier,
      data.tierName,
      data.rr,
      data.winRate,
      data.kda,
      data.lastSyncedAt,
    );
  }
}
