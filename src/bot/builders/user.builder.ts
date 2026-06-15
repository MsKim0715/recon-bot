import { DiscordModule } from "../types.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { MODALS } from "@/bot/constants/modals.js";
import { PrismaUserRepository } from "@/modules/user/adapters/prisma.user.repository.js";
import { UserService } from "@/modules/user/domain/user.service.js";
import {
  UserCommand,
  userRegisterCommandDef,
  userViewCommandDef,
  userDeleteCommandDef,
} from "@/modules/user/adapters/user.command.js";
import { UserModal } from "@/modules/user/adapters/user.modal.js";

export function buildUserModule(): DiscordModule {
  const repository = new PrismaUserRepository();
  const service = new UserService(repository);
  const command = new UserCommand(service);
  const modal = new UserModal(service);

  return {
    commands: [
      { name: COMMANDS.MEMBER_REGISTER, def: userRegisterCommandDef, handler: command.register },
      { name: COMMANDS.MEMBER_VIEW,     def: userViewCommandDef,     handler: command.view },
      { name: COMMANDS.MEMBER_DELETE,   def: userDeleteCommandDef,   handler: command.delete },
    ],
    modals: [{ id: MODALS.MEMBER_REGISTER, handler: modal.register }],
  };
}