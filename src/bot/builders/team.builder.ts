import { DiscordModule } from "../types.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { MODALS } from "@/bot/constants/modals.js";
import { BUTTONS } from "@/bot/constants/buttons.js";
import { PrismaTeamRepository } from "@/modules/team/adapters/prisma.team.repository.js";
import { TeamService } from "@/modules/team/domain/team.service.js";
import { TeamCommand, teamViewCommandDef } from "@/modules/team/adapters/team.command.js";
import { TeamModal } from "@/modules/team/adapters/team.modal.js";
import { TeamButton } from "@/modules/team/adapters/team.button.js";

export function buildTeamModule(): DiscordModule {
  const repository = new PrismaTeamRepository();
  const service = new TeamService(repository);
  const command = new TeamCommand(service);
  const modal = new TeamModal(service);
  const button = new TeamButton(service);

  return {
    // 진입점은 허브 하나
    commands: [
      { name: COMMANDS.TEAM_VIEW, def: teamViewCommandDef, handler: command.view },
    ],
    // 모달 유지 — [팀 생성]/[팀 정보 수정] 버튼이 연다
    modals: [
      { id: MODALS.TEAM_CREATE, handler: modal.create },
      { id: MODALS.TEAM_UPDATE, handler: modal.update },
    ],
    buttons: [
      // 기존
      { id: BUTTONS.TEAM_APPLICATION_ACCEPT, handler: button.accept },
      { id: BUTTONS.TEAM_APPLICATION_REJECT, handler: button.reject },
      { id: BUTTONS.TEAM_LIST,               handler: button.listPage },
      // 허브 신규
      { id: BUTTONS.TEAM_CREATE_OPEN,        handler: button.openCreate },
      { id: BUTTONS.TEAM_UPDATE_OPEN,        handler: button.openUpdate },
      { id: BUTTONS.TEAM_BROWSE,             handler: button.openList },
      { id: BUTTONS.TEAM_DISBAND,            handler: button.disband },
      { id: BUTTONS.TEAM_MEMBERS,            handler: button.members },
      { id: BUTTONS.TEAM_PENDING,            handler: button.pending },
      { id: BUTTONS.TEAM_LEAVE,              handler: button.leave },
      { id: BUTTONS.TEAM_JOIN_OPEN,          handler: button.join },
      { id: BUTTONS.TEAM_KICK,               handler: button.kick },
      { id: BUTTONS.TEAM_TRANSFER,           handler: button.transfer },
      { id: BUTTONS.TEAM_APPLY_CANCEL,       handler: button.cancelApplication },
    ],
    // autocompletes 제거 (팀원추방 커맨드 삭제로 불필요)
  };
}