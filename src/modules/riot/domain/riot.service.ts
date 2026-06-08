import { guardIsRegistered } from "@/shared/guards/index.js";
import { RiotApiPort } from "../ports/riot.api.port.js";
import { RiotRepositoryPort } from "../ports/riot.repository.port.js";
import { RiotAccount } from "./riot.entity.js";
import {
  DuplicateError,
  NotFoundError,
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

    const userId = await this.riotRepo.resolveUserId(discordId, guildId);
    if (!userId) throw new NotFoundError("회원");

    const accountInfo = await this.riotApi.fetchAccount(gameName, tagLine);

    const existingByPuuid = await this.riotRepo.findByPuuid(accountInfo.puuid);
    const existingByUser = await this.riotRepo.findByUserId(userId);
    // 다른 유저가 이미 이 puuid를 연동한 경우
    if (
      existingByPuuid &&
      (!existingByUser || existingByUser.puuid !== existingByPuuid.puuid)
    ) {
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

    if (existingByUser) {
      await this.riotRepo.update(userId, riotAccount);
    } else {
      await this.riotRepo.save(userId, riotAccount);
    }

    return riotAccount;
  }

  async getAccount(discordId: string, guildId: string): Promise<RiotAccount> {
    await guardIsRegistered(discordId, guildId);

    const userId = await this.riotRepo.resolveUserId(discordId, guildId);
    if (!userId) throw new NotFoundError("회원");

    const account = await this.riotRepo.findByUserId(userId);
    if (!account) throw new NotFoundError("연동된 Riot 계정");

    // 30분 이내면 캐시된 값 반환
    if (account.lastSyncedAt) {
      const diff = Date.now() - account.lastSyncedAt.getTime();
      if (diff < 1000 * 60 * 30) {
        return account;
      }
    }

    const rankInfo = await this.riotApi.fetchRank(account.puuid, account.region);

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

    await this.riotRepo.update(userId, updatedAccount);
    return updatedAccount;  // 버그1 수정: account → updatedAccount
  }
}