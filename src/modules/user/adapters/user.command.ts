import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { Handler } from "@/bot/routers/base.router.js";
import { UserService } from "../domain/user.service.js";
import { buildRegisterModal } from "./user.modal-ui.js";
import { handleError } from "@/shared/errors/handle-error.js";
import { profileComponents } from "./user.components.js";

export const userRegisterCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.MEMBER_REGISTER)
  .setDescription("Register as a member")
  .setNameLocalizations({
    ko: "회원등록",
  })
  .setDescriptionLocalizations({
    ko: "회원 등록을 합니다",
  });

export const userViewCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.MEMBER_VIEW)
  .setDescription("View your profile")
  .setNameLocalizations({
    ko: "회원정보",
  })
  .setDescriptionLocalizations({
    ko: "회원 정보를 보여줍니다",
  });

export const userDeleteCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.MEMBER_DELETE)
  .setDescription("Leave the server")
  .setNameLocalizations({
    ko: "회원탈퇴",
  })
  .setDescriptionLocalizations({
    ko: "회원탈퇴를 합니다",
  });
export class UserCommand {
  constructor(private readonly userService: UserService) {}

  get register(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        await interaction.showModal(buildRegisterModal());
      },
    };
  }

  get view(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const user = await this.userService.findByDiscordId(
            interaction.user.id,
            interaction.guildId!,
          );

          await interaction.reply({
            components: [profileComponents(interaction.user, user)],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          });
        } catch (e) {
          handleError(interaction, e);
        }
      },
    };
  }

  get delete(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          await this.userService.delete(
            interaction.user.id,
            interaction.guildId!,
          );

          await interaction.reply({
            content: "회원 탈퇴가 완료됐습니다",
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          handleError(interaction, e);
        }
      },
    };
  }
}
