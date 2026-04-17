import { startBot } from "./bot/index.js";
import { initScheduler } from "./infra/scheduler.js";
import { logger } from "./infra/logger.js";

async function main() {
  logger.info("리콘 봇 시작 중...");
  initScheduler();
  await startBot();
}

main().catch((err) => {
  logger.error(err, "ERROR");
  process.exit(1);
});
