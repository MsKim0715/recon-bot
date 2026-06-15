import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { Handler } from "@/bot/routers/base.router.js";
import { TeamService } from "../domain/team.service.js";
import { buildTeamHubPayload } from "./team.hub.js";
import { handleError } from "@/shared/errors/handle-error.js";

export const teamViewCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_VIEW)
  .setDescription("Open team hub")
  .setNameLocalizations({ ko: "팀" })
  .setDescriptionLocalizations({ ko: "팀 허브를 엽니다" });

export class TeamCommand {
  constructor(private readonly teamService: TeamService) {}

  // 팀의 단일 진입점(허브). 생성/수정/해체/목록/가입/신청관리/추방/탈퇴/위임/신청취소를
  // 전부 역할별 버튼으로 처리한다.
  get view(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const { components } = await buildTeamHubPayload(
            this.teamService,
            interaction.guildId!,
            interaction.user.id,
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }
}