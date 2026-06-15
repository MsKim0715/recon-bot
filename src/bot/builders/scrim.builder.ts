import { DiscordModule } from "../types.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { MODALS } from "@/bot/constants/modals.js";
import { BUTTONS } from "@/bot/constants/buttons.js";
import { PrismaScrimRepository } from "@/modules/scrim/adapter/prisma.scrim.repository.js";
import { ScrimService } from "@/modules/scrim/domain/scrim.service.js";
import { ScrimCommand, scrimListCommandDef } from "@/modules/scrim/adapter/scrim.command.js";
import { ScrimModal } from "@/modules/scrim/adapter/scrim.modal.js";
import { ScrimButton } from "@/modules/scrim/adapter/scrim.button.js";
import { ScrimScheduler } from "@/modules/scrim/adapter/scrim.scheduler.js";

export function buildScrimModule(): DiscordModule {
  const repository = new PrismaScrimRepository();
  const service = new ScrimService(repository);
  const command = new ScrimCommand(service);
  const modal = new ScrimModal(service);
  const button = new ScrimButton(service);
  const scheduler = new ScrimScheduler(service);

  return {
    // 진입점은 허브 하나
    commands: [
      { name: COMMANDS.SCRIM_LIST, def: scrimListCommandDef, handler: command.list },
    ],
    // 모달은 유지 — [스크림 모집]/[신청] 버튼이 연다
    modals: [
      { id: MODALS.SCRIM_CREATE, handler: modal.create },
      { id: MODALS.SCRIM_APPLY,  handler: modal.apply },
    ],
    buttons: [
      { id: BUTTONS.SCRIM_LIST,         handler: button.listPage },
      { id: BUTTONS.SCRIM_ACCEPT,       handler: button.accept },
      { id: BUTTONS.SCRIM_REJECT,       handler: button.reject },
      { id: BUTTONS.SCRIM_CREATE_OPEN,  handler: button.openCreate },
      { id: BUTTONS.SCRIM_APPLY_OPEN,   handler: button.openApply },
      { id: BUTTONS.SCRIM_APPLICATIONS, handler: button.applications },
      { id: BUTTONS.SCRIM_CLOSE,        handler: button.close },
      { id: BUTTONS.SCRIM_CANCEL,       handler: button.cancel },
      { id: BUTTONS.SCRIM_MY_APPS,      handler: button.myApplications },
      { id: BUTTONS.SCRIM_APPLY_CANCEL, handler: button.cancelApplication },
    ],
    // autocompletes 제거 (커맨드가 사라져서 붙을 데가 없음)
    scheduler,
  };
}