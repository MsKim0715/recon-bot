import { PrismaScrimRepository } from "@/modules/scrim/adapter/prisma.scrim.repository.js";
import { ScrimButton } from "@/modules/scrim/adapter/scrim.button.js";
import { ScrimCommand } from "@/modules/scrim/adapter/scrim.command.js";
import { ScrimModal } from "@/modules/scrim/adapter/scrim.modal.js";
import { ScrimScheduler } from "@/modules/scrim/adapter/scrim.scheduler.js";
import { ScrimService } from "@/modules/scrim/domain/scrim.service.js";


export function buildScrimModule() {
  const repository = new PrismaScrimRepository();
  const service = new ScrimService(repository);
  const command = new ScrimCommand(service);
  const modal = new ScrimModal(service);
  const button = new ScrimButton(service);
  const scheduler = new ScrimScheduler(service);

  return { command, modal,scheduler, button };
}