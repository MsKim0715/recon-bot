import { DiscordModule } from '@/bot/types.js';
import { COMMANDS } from '@/bot/constants/commands.js';
import { MODALS } from '@/bot/constants/modals.js';
import { BUTTONS } from '@/bot/constants/buttons.js';
import { PrismaMatchRepository } from '@/modules/match/adapter/prisma.match.repository.js';
import { MatchService } from '@/modules/match/domain/match.service.js';
import { MatchCommand, matchListCommandDef } from '@/modules/match/adapter/match.command.js';
import { MatchModal } from '@/modules/match/adapter/match.modal.js';
import { MatchButton } from '@/modules/match/adapter/match.button.js';
import { MatchScheduler } from '@/modules/match/adapter/match.scheduler.js';


export function buildMatchModule(): DiscordModule {
  const repo = new PrismaMatchRepository();
  const service = new MatchService(repo);
  const command = new MatchCommand(service);
  const modal = new MatchModal(service);
  const button = new MatchButton(service);
  const scheduler = new MatchScheduler();

  return {
    // 진입점은 허브 하나
    commands: [
      { name: COMMANDS.MATCH_LIST, def: matchListCommandDef, handler: command.list },
    ],
    // 결과 모달 유지 — [결과 입력] 버튼이 연다
    modals: [{ id: MODALS.MATCH_RESULT, handler: modal.result }],
    buttons: [
      { id: BUTTONS.MATCH_APPROVE,     handler: button.approve },
      { id: BUTTONS.MATCH_REJECT,      handler: button.reject },
      { id: BUTTONS.MATCH_LIST,        handler: button.listPage },
      { id: BUTTONS.MATCH_RESULT_OPEN, handler: button.resultOpen },
      { id: BUTTONS.MATCH_NOSHOW,      handler: button.noShow },
    ],
    // autocompletes 제거 (경기결과/노쇼신고 커맨드 삭제)
    scheduler,
  };
}