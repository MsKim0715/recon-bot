import { guardIsRegistered } from "@/shared/guards/index.js";
import { RiotApiPort } from "../ports/riot.api.port.js";
import { RiotRepositoryPort } from "../ports/riot.repository.port.js";
import { RiotAccount } from "./riot.entity.js";
import { DuplicateError, NotFoundError } from "@/shared/errors/index.js";
import { RiotRegion } from "@/generated/prisma/index.js";
import { logger } from "@/infra/logger.js";

// Henrik 레이트리밋: 분당 30콜. 갱신 1건당 2콜(fetchRank + fetchRecentStats)
// → 분당 최대 15건 → 건 사이 4초 간격. (실제 호출 지연이 더해져 30/min 밑으로 안전하게 떨어짐)
const RATE_LIMIT_PER_MIN = 30;
const CALLS_PER_ACCOUNT = 2;
const SYNC_DELAY_MS = Math.ceil(60_000 / (RATE_LIMIT_PER_MIN / CALLS_PER_ACCOUNT)); // 4000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

    const statsInfo = await this.riotApi.fetchRecentStats(
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
      statsInfo?.winRate ?? null,
      statsInfo?.kda ?? null,
      rankInfo || statsInfo ? new Date() : null,
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

    return this.refreshAccount(userId, account);
  }

  // 단일 계정 강제 갱신: rank/stats 재조회 → 저장. (getAccount·스케줄러 공용)
  // 캐시/권한 체크 없음 — 호출 측에서 판단.
  private async refreshAccount(
    userId: string,
    account: RiotAccount,
  ): Promise<RiotAccount> {
    const rankInfo = await this.riotApi.fetchRank(account.puuid, account.region);
    const statsInfo = await this.riotApi.fetchRecentStats(
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
      statsInfo?.winRate ?? account.winRate,
      statsInfo?.kda ?? account.kda,
      new Date(),
    );

    await this.riotRepo.update(userId, updatedAccount);
    return updatedAccount;
  }

  // 전 유저 전적 일괄 갱신 (스케줄러용).
  // 레이트리밋 회피: 순차 처리 + 건 사이 딜레이. 한 건 실패해도 다음 진행.
  async syncAllAccounts(): Promise<{ total: number; ok: number; failed: number }> {
    const accounts = await this.riotRepo.findAllWithUserIds();

    let ok = 0;
    let failed = 0;

    for (let i = 0; i < accounts.length; i++) {
      const { userId, account } = accounts[i];
      try {
        await this.refreshAccount(userId, account);
        ok += 1;
      } catch (e) {
        failed += 1;
        logger.warn(
          { userId, puuid: account.puuid, err: e instanceof Error ? e.message : e },
          "전적 갱신 실패(스킵)",
        );
      }

      // 마지막 건 뒤에는 대기 불필요
      if (i < accounts.length - 1) {
        await sleep(SYNC_DELAY_MS);
      }
    }

    return { total: accounts.length, ok, failed };
  }
}