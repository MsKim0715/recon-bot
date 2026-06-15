import nodeCron from 'node-cron';
import { logger } from './logger.js';
import { schedulers } from '@/bot/registry.js';

export function initScheduler(): void {

  
  for(const schedule of schedulers){
    schedule.register();
  }

  // 공통 스케줄


  nodeCron.schedule('*/5 * * * *', async () => {
    logger.debug('노쇼 감지 체크');
  });

  nodeCron.schedule('0 4 * * *', async () => {
    logger.info('전적 자동 갱신 시작');
  });

  nodeCron.schedule('0 0 * * *', async () => {
    logger.info('만료 모집글 마감 처리');
  });

  logger.info('스케줄러 초기화 완료');
}