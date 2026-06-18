import nodeCron from "node-cron";
import { logger } from "@/infra/logger.js";
import { Scheduler } from "@/bot/types.js";
import { RiotService } from "../domain/riot.service.js";

export class RiotScheduler implements Scheduler {
  constructor(private readonly riotService: RiotService) {}

  register(): void {
    // 매일 새벽 4시: 전 유저 전적 일괄 갱신 (레이트리밋 회피는 서비스가 처리)
    nodeCron.schedule("* * * * *", async () => {
      logger.info("전적 자동 갱신 시작");
      try {
        const result = await this.riotService.syncAllAccounts();
        logger.info(result, "전적 자동 갱신 완료");
      } catch (e) {
        logger.error(e, "전적 자동 갱신 실패");
      }
    });

    logger.info("전적 스케줄러 등록 완료");
  }
}
