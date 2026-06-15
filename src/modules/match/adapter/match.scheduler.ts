import nodeCron from 'node-cron';
import { ContainerBuilder, MessageFlags } from 'discord.js';
import { prisma } from '@/infra/database.js';
import { logger } from '@/infra/logger.js';
import { Scheduler } from '@/bot/types.js';
import {
  matchReminderComponents,
  matchNoResultWarningComponents,
} from './match.components.js';
import { client } from '@/bot/starting/bot.client.js';

// 시작 후 이 시간까지 결과가 안 들어오면 "미입력" 경고
const NO_RESULT_GRACE_MS = 1000 * 60 * 60 * 2; // 2시간
const TICK_MS = 60_000;

const matchInclude = {
  homeTeam: { select: { name: true, leaderId: true } },
  awayTeam: { select: { name: true, leaderId: true } },
  scrim: { select: { number: true } },
} as const;

export class MatchScheduler implements Scheduler {
  register(): void {
    // 매분: 시작 1분 전 리마인드 + 시작 지났는데 결과 미입력 경고
    nodeCron.schedule('* * * * *', async () => {
      const now = Date.now();
      try {
        await this.remindUpcoming(now);
        await this.warnNoResult(now);
      } catch (e) {
        logger.error(e, '경기 스케줄러 실행 실패');
      }
    });
    logger.info('경기 스케줄러 등록 완료');
  }

  // scheduledAt ∈ (now, now+60s]  → 한 틱에 정확히 한 번 걸림 (플래그 불필요)
  private async remindUpcoming(now: number): Promise<void> {
    const matches = await prisma.match.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gt: new Date(now), lte: new Date(now + TICK_MS) },
      },
      include: matchInclude,
    });

    for (const m of matches) {
      const card = matchReminderComponents(
        m.scrim.number,
        m.homeTeam.name,
        m.awayTeam.name,
        m.scheduledAt,
      );
      await this.dmBoth(m.homeTeam.leaderId, m.awayTeam.leaderId, card);
    }
  }

  // scheduledAt ∈ (now-2h-60s, now-2h]  이고 아직 SCHEDULED(결과 미입력)
  private async warnNoResult(now: number): Promise<void> {
    const matches = await prisma.match.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gt: new Date(now - NO_RESULT_GRACE_MS - TICK_MS),
          lte: new Date(now - NO_RESULT_GRACE_MS),
        },
      },
      include: matchInclude,
    });

    for (const m of matches) {
      const card = matchNoResultWarningComponents(
        m.scrim.number,
        m.homeTeam.name,
        m.awayTeam.name,
        m.scheduledAt,
      );
      await this.dmBoth(m.homeTeam.leaderId, m.awayTeam.leaderId, card);
    }
  }

  // 두 팀 리더에게 DM. 한쪽 실패해도 다른 쪽은 보냄.
  private async dmBoth(
    leaderA: string,
    leaderB: string,
    card: ContainerBuilder,
  ): Promise<void> {
    for (const leaderId of [leaderA, leaderB]) {
      try {
        const user = await client.users.fetch(leaderId);
        await user.send({ flags: MessageFlags.IsComponentsV2, components: [card] });
      } catch (e) {
        logger.warn({ leaderId }, '경기 알림 DM 실패');
      }
    }
  }
}