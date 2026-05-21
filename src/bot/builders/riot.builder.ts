import { henrikApiApdater } from "@/modules/riot/adapter/henrik.api.adapter.js";
import { PrismaRiotRepository } from "@/modules/riot/adapter/prisma.riot.repository.js";
import { RiotCommand } from "@/modules/riot/adapter/riot.command.js";
import { RiotModal } from "@/modules/riot/adapter/riot.modal.js";
import { RiotService } from "@/modules/riot/domain/riot.service.js";


export function buildRiotModule() {
  const riotApi = new henrikApiApdater();
  const riotRepo = new PrismaRiotRepository();
  const service = new RiotService(riotRepo, riotApi);
  const command = new RiotCommand(service);
  const modal = new RiotModal(service);

  return { command, modal };
}