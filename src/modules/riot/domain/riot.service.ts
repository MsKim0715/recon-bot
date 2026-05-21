import { guardIsRegistered } from "@/shared/guards/index.js";
import { RiotApiPort } from "../ports/riot.api.port.js";
import { RiotRepositoryPort } from "../ports/riot.repository.port.js";
import { RiotAccount } from "./riot.entity.js";
import { prisma } from "@/infra/database.js";
import {
  DuplicateError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/index.js";
import { RiotRegion } from "@/generated/prisma/index.js";

export class RiotService {
  constructor(
    private readonly riotRepo: RiotRepositoryPort,
    private readonly riotApi: RiotApiPort,
  ) {}

  async linkAccount(
    discordId: string,
    guildId: string,
    gameName: string,
    tagLine: string,
  ): Promise<RiotAccount> {
    await guardIsRegistered(discordId, guildId);

    const user = await prisma.user.findUnique({
      where: { discordId_guildId: { discordId, guildId } },
    });
    if (!user) throw new NotFoundError("회원");

    const accountInfo = await this.riotApi.fetchAccount(gameName, tagLine);

    const existingByPuuid = await prisma.riotAccount.findUnique({
      where: { puuid: accountInfo.puuid },
    });
    if (existingByPuuid && existingByPuuid.userId !== user.id) {
      throw new DuplicateError("이미 다른 계정에 연동된 Riot 계정입니다");
    }

    const rankInfo = await this.riotApi.fetchRank(
      accountInfo.puuid,
      accountInfo.region,
    );

    const riotAccount = new RiotAccount(
      accountInfo.puuid,
      accountInfo.gameName,
      accountInfo.tagLine,
      accountInfo.region as RiotRegion,
      rankInfo?.currentTier ?? null,
      rankInfo?.tierName ?? null,
      rankInfo?.rr ?? null,
      null,
      null,
      rankInfo ? new Date() : null,
    );

    const existingAccount = await this.riotRepo.findByUserId(user.id);
    if (existingAccount) {
      await this.riotRepo.update(user.id, riotAccount);
    } else {
      await this.riotRepo.save(user.id, riotAccount);
    }

    return riotAccount;
  }

  async getAccount(discordId: string, guildId: string): Promise<RiotAccount> {
    await guardIsRegistered(discordId, guildId);

    const user = await prisma.user.findUnique({
      where: { discordId_guildId: { discordId, guildId } },
    });
    if (!user) throw new NotFoundError("회원");

    const account = await this.riotRepo.findByUserId(user.id);
    if (!account) throw new NotFoundError("연동된 Riot 계정");


    console.log('account :', account);
    console.log('lastSyncedAt:', account.lastSyncedAt);
    if (account.lastSyncedAt) {
      const diff = Date.now() - account.lastSyncedAt.getTime();
      if (diff < 1000 * 60 * 30) {
        return account;
      }
    }

    const rankInfo = await this.riotApi.fetchRank(
      account.puuid,
      account.region,
    );

    const updatedAccount = new RiotAccount(
      account.puuid,
      account.gameName,
      account.tagLine,
      account.region,
      rankInfo?.currentTier ?? account.currentTier,
      rankInfo?.tierName ?? account.tierName,
      rankInfo?.rr ?? account.rr,
      account.winRate,
      account.kda,
      new Date(),
    );

    await this.riotRepo.update(user.id, updatedAccount);
    return account;
  }
}
