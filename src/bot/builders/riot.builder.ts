import { DiscordModule } from "@/bot/types.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { MODALS } from "@/bot/constants/modals.js";
import { henrikApiApdater } from "@/modules/riot/adapter/henrik.api.adapter.js";
import { PrismaRiotRepository } from "@/modules/riot/adapter/prisma.riot.repository.js";
import { RiotService } from "@/modules/riot/domain/riot.service.js";
import {
  RiotCommand,
  riotLinkCommandDef,
  riotViewCommandDef,
} from "@/modules/riot/adapter/riot.command.js";
import { RiotModal } from "@/modules/riot/adapter/riot.modal.js";
import { RiotScheduler } from "@/modules/riot/adapter/riot.scheduler.js";

export function buildRiotModule(): DiscordModule {
  const riotApi = new henrikApiApdater();
  const riotRepo = new PrismaRiotRepository();
  const service = new RiotService(riotRepo, riotApi);
  const command = new RiotCommand(service);
  const modal = new RiotModal(service);
  const scheduler = new RiotScheduler(service);

  return {
    commands: [
      { name: COMMANDS.VALORANT_LINK, def: riotLinkCommandDef, handler: command.link },
      { name: COMMANDS.VALORANT_VIEW, def: riotViewCommandDef, handler: command.view },
    ],
    modals: [{ id: MODALS.VALORANT_LINK, handler: modal.link }],
    scheduler,
  };
}
