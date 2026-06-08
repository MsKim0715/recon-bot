import nodeCron from 'node-cron';
import { ScrimService } from '../domain/scrim.service.js';
import { logger } from '@/infra/logger.js';

export class ScrimScheduler {
  constructor(private readonly scrimService: ScrimService) {}

  register(): void {
    nodeCron.schedule('* * * * *', async () => {
      try {
        logger.info('만료된 스크림 자동 파기 시작');
        await this.scrimService.expireOpenScrims();
        logger.info('만료된 스크림 자동 파기 완료');
      } catch (e) {
        logger.error(e, '스크림 자동 파기 실패');
      }
    });
  }
}