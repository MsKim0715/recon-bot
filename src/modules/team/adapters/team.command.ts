import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AutocompleteInteraction,
} from "discord.js";
import { COMMANDS } from "@/bot/constants/commands.js";
import { BUTTONS } from "@/bot/constants/buttons.js";
import { Handler } from "@/bot/routers/base.router.js";
import { TeamService } from "../domain/team.service.js";
import { buildTeamCreateModal, buildTeamUpdateModal } from "./team.modal-ui.js";
import {
  teamProfileComponents,
  teamListComponents,
  teamApplicationsComponents,
  teamTransferredComponents,
} from "./team.components.js";
import { handleError } from "@/shared/errors/handle-error.js";

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

export const teamListCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_LIST)
  .setDescription("Team list")
  .setNameLocalizations({ ko: "팀목록" })
  .setDescriptionLocalizations({ ko: "팀 목록을 조회합니다" });

export const teamJoinCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_JOIN)
  .setDescription("Apply to join a team")
  .setNameLocalizations({ ko: "팀가입" })
  .setDescriptionLocalizations({ ko: "팀 가입을 신청합니다" })
  .addStringOption((option) =>
    option.setName("teamname").setDescription("팀 이름").setRequired(true),
  );

export const teamPendingCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_APPLICATION)
  .setDescription("View pending applications")
  .setNameLocalizations({ ko: "가입신청목록" })
  .setDescriptionLocalizations({ ko: "팀 가입 신청 목록을 조회합니다" });

export const teamKickCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_KICK)
  .setDescription("Kick a team member")
  .setNameLocalizations({ ko: "팀원추방" })
  .setDescriptionLocalizations({ ko: "팀원을 추방합니다" })
  .addStringOption((option) =>
    option.setName("member").setDescription("추방할 팀원").setRequired(true).setAutocomplete(true)
  );

export const teamLeaveCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_LEAVE)
  .setDescription('Leave the team')
  .setNameLocalizations({ ko: '팀탈퇴' })
  .setDescriptionLocalizations({ ko: '팀을 탈퇴합니다' });

export const teamTransferCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_TRANSFER)
  .setDescription('Transfer leader')
  .setNameLocalizations({ ko: '리더양도' })
  .setDescriptionLocalizations({ ko: '리더를 양도합니다' })
  .addUserOption(option =>
    option
      .setName('user')
      .setNameLocalizations({ ko: '유저' })
      .setDescription('리더를 양도할 팀원')
      .setRequired(true)
  );
export const teamUpdateCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_UPDATE)
  .setDescription('Update team info')
  .setNameLocalizations({ ko: '팀수정' })
  .setDescriptionLocalizations({ ko: '팀 정보를 수정합니다' });


export const teamCancelCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.TEAM_CANCEL)
  .setDescription('Cancel team application')
  .setNameLocalizations({ ko: '신청취소' })
  .setDescriptionLocalizations({ ko: '팀 가입 신청을 취소합니다' })
  .addStringOption(option =>
    option
      .setName('teamname')
      .setNameLocalizations({ ko: '팀이름' })
      .setDescription('신청 취소할 팀 이름')
      .setRequired(true)
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
          const detail = await this.teamService.findDetailByLeaderId(
            interaction.user.id,
            interaction.guildId!,
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [teamProfileComponents(detail)],
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
            content: " 팀이 해체됐습니다",
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
          interaction.guildId!
        );

        const { containers, row } = teamListComponents(teams, 0);

        await interaction.reply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [...containers, row],
        });
      } catch (e) {
        await handleError(interaction, e);
      }
    }
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
                .setCustomId(`${BUTTONS.TEAM_APPLICATION_REJECT}:${app.userId}`)
                .setLabel("거절")
                .setStyle(ButtonStyle.Danger),
            ),
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [teamApplicationsComponents(applications), ...rows],
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
        const targetUserId = interaction.options.getString('member', true);

        await this.teamService.kickMember(
          interaction.user.id,
          interaction.guildId!,
          targetUserId
        );

        await interaction.reply({
          content: '팀원을 추방했습니다',
          flags: MessageFlags.Ephemeral
        });
      } catch (e) {
        await handleError(interaction, e);
      }
    }
  };
}

  get leave(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          await this.teamService.leaveTeam(
            interaction.user.id,
            interaction.guildId!
          );

          await interaction.reply({
            content: '팀을 탈퇴했습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }


  get transfer(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const targetUser = interaction.options.getUser('user', true);

          await this.teamService.transferLeader(
            interaction.user.id,
            interaction.guildId!,
            targetUser.id
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [teamTransferredComponents(targetUser.username)],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }



get update(): Handler<ChatInputCommandInteraction> {
  return {
    handle: async (interaction: ChatInputCommandInteraction) => {
      try {
        const team = await this.teamService.findDetailByLeaderId(
          interaction.user.id,
          interaction.guildId!
        );
        await interaction.showModal(buildTeamUpdateModal(team.team));
      } catch (e) {
        if (!interaction.replied && !interaction.deferred) {
          await handleError(interaction, e);
        }
      }
    }
  };
}

  get cancel(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const teamName = interaction.options.getString('teamname', true);

          await this.teamService.cancelApplication(
            interaction.user.id,
            interaction.guildId!,
            teamName
          );

          await interaction.reply({
            content: ` **${teamName}** 팀 가입 신청을 취소했습니다`,
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get kickAutocomplete(): { handle(interaction: AutocompleteInteraction): Promise<void> } {
  return {
    handle: async (interaction: AutocompleteInteraction) => {
      try {
        const members = await this.teamService.getMembers(
          interaction.user.id,
          interaction.guildId!
        );

        const focused = interaction.options.getFocused().toLowerCase();

        const filtered = members
          .filter(m =>
            m.userId !== interaction.user.id &&
            m.username.toLowerCase().includes(focused)
          )
          .map(m => ({
            name: m.username,
            value: m.userId,
          }));

        await interaction.respond(filtered);
      } catch {
        await interaction.respond([]);
      }
    }
  };
}
}

 


