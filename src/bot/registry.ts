import { COMMANDS } from "./constants/commands.js";
import {
  pingCommandDef,
  pingCommand,
} from "@/modules/ping/adapters/ping.command.js";
import { buildUserModule } from "./builders/user.builder.js";
import { buildTeamModule } from "./builders/team.builder.js";
import { buildScrimModule } from "./builders/scrim.builder.js";
import { buildRiotModule } from "./builders/riot.builder.js";
import {
  AutocompleteEntry,
  ButtonEntry,
  CommandEntry,
  DiscordModule,
  ModalEntry,
} from "./types.js";
import { buildMatchModule } from "./builders/match.builder.js";

const modules: DiscordModule[] = [
  // ping 은 빌더가 없으니 인라인 디스크립터로
  {
    commands: [
      { name: COMMANDS.PING, def: pingCommandDef, handler: pingCommand },
    ],
  },
  buildUserModule(),
  buildTeamModule(),
  buildScrimModule(),
  buildRiotModule(),
  buildMatchModule(), // ← 새 모듈은 이 한 줄만 추가
];

export const commandEntries: CommandEntry[] = modules.flatMap(
  (m) => m.commands ?? [],
);
export const modalEntries: ModalEntry[] = modules.flatMap(
  (m) => m.modals ?? [],
);
export const buttonEntries: ButtonEntry[] = modules.flatMap(
  (m) => m.buttons ?? [],
);
export const autocompleteEntries: AutocompleteEntry[] = modules.flatMap(
  (m) => m.autocompletes ?? [],
);

// scheduler 를 가진 모듈만 모음 (기존 schedulerModules 객체 대체)
export const schedulers = modules
  .map((m) => m.scheduler)
  .filter((s): s is NonNullable<typeof s> => s !== undefined);
