import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { Handler } from "@/bot/routers/base.router.js";
import { TeamService } from "../domain/team.service.js";
import { buildTeamCreateModal } from "./team.modal-ui.js";
import {
  teamApplicationsEmBed,
  teamListEmbed,
  teamProfileEmbed,
} from "./team.embed.js";
import { handleError } from "@/shared/errors/handle-error.js";
import { BUTTONS } from "@/bot/constants/buttons.js";

export const teamCreateCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_CREATE)
  .setDescription("Team creation")
  .setNameLocalizations({ ko: "팀생성" })
  .setDescriptionLocalizations({ ko: "새로운 팀을 생성합니다" });

export const teamViewCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_VIEW)
  .setDescription("Team information")
  .setNameLocalizations({ ko: "팀조회" })
  .setDescriptionLocalizations({ ko: "팀 정보를 조회합니다" });

export const teamDisbandCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_DISBAND)
  .setDescription("Disband team")
  .setNameLocalizations({ ko: "팀해체" })
  .setDescriptionLocalizations({ ko: "팀을 해체합니다" });

export const teamJoinCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_JOIN)
  .setDescription("Apply to join a team")
  .setNameLocalizations({ ko: "팀가입" })
  .setDescriptionLocalizations({ ko: "팀 가입을 신청합니다" })
  .addStringOption((option) =>
    option.setName("teamname").setDescription("팀 이름").setRequired(true),
  );

export const teamListCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_LIST)
  .setDescription('Team list')
  .setNameLocalizations({ ko: '팀목록' })
  .setDescriptionLocalizations({ ko: '팀 목록을 조회합니다' });

export const teamPendingCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_APPLICATION)
  .setDescription("View pending applications")
  .setNameLocalizations({ ko: "가입신청목록" })
  .setDescriptionLocalizations({ ko: "팀 가입 신청 목록을 조회합니다." });

export const teamKickCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_KICK)
  .setDescription("Kick a team memeber")
  .setNameLocalizations({ ko: "팀원추방" })
  .setDescriptionLocalizations({ ko: "팀원을 추방합니다" })
  .addUserOption((option) =>
    option.setName("user").setDescription("추방할 팀원").setRequired(true),
  );

export class TeamCommand {
  constructor(private readonly teamService: TeamService) {}

  get create(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        await interaction.showModal(buildTeamCreateModal());
      },
    };
  }

  get view(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const team = await this.teamService.findByLeaderId(
            interaction.user.id,
            interaction.guildId!,
          );

          await interaction.reply({
            embeds: [teamProfileEmbed(team)],
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }

  get disband(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          await this.teamService.disband(
            interaction.user.id,
            interaction.guildId!,
          );
          await interaction.reply({
            content: "팀이 해체됐습니다",
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }

  get list(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const teams = await this.teamService.findAllByGuildId(
            interaction.guildId!,
          );
          await interaction.reply({
            embeds: [teamListEmbed(teams)],
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }

  get join(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const teamName = interaction.options.getString("teamname", true);

          await this.teamService.applyJoin(
            interaction.user.id,
            interaction.guildId!,
            teamName,
          );

          await interaction.reply({
            content: ` ${teamName} 팀에 가입 신청했습니다`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
  get pending(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const applications = await this.teamService.getPendingApplications(
            interaction.user.id,
            interaction.guildId!,
          );

          if (applications.length === 0) {
            await interaction.reply({
              content: "신청이 없습니다",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          const rows = applications.map((app) =>
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`${BUTTONS.TEAM_APPLICATION_ACCEPT}:${app.userId}`)
                .setLabel("수락")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(
                  `${BUTTONS.TEAM_APPLICATION_REJECT} : ${app.userId}`,
                )
                .setLabel("거절")
                .setStyle(ButtonStyle.Danger),
            ),
          );

          await interaction.reply({
            embeds: [teamApplicationsEmBed(applications)],
            components: rows,
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
  get kick(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const targetUser = interaction.options.getUser("user", true);

          await this.teamService.kickMember(
            interaction.user.id,
            interaction.guildId!,
            targetUser.id,
          );

          await interaction.reply({
            content: ` ${targetUser.username} 님을 팀에서 추방했습니다`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
}
