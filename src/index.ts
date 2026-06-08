import { startBot } from './bot/index.js';
import { initScheduler } from './infra/scheduler.js';
import { logger } from './infra/logger.js';

process.on('unhandledRejection', (reason) => {
  logger.error(reason, 'unhandledRejection 발생');
});

process.on('uncaughtException', (error) => {
  logger.error(error, 'uncaughtException 발생');
  process.exit(1);
});

async function main() {
  logger.info('리콘 봇 시작 중...');

  initScheduler();

  await startBot();
}

main().catch((err) => {
  logger.error(err, '치명적 오류 발생');
  process.exit(1);
});