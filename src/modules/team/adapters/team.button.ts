import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { TeamService } from '../domain/team.service.js';
import { teamListComponents } from './team.components.js';
import { handleError } from '@/shared/errors/handle-error.js';

export class TeamButton {
  constructor(private readonly teamService: TeamService) {}


  get listPage(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const page = parseInt(interaction.customId.split(':')[3]);
          const teams = await this.teamService.findAllByGuildId(interaction.guildId!);
          const { containers, row } = teamListComponents(teams, page);

          await interaction.update({
            components: [...containers, row],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get accept(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const applicantId = interaction.customId.split(':')[4];

          await this.teamService.acceptApplication(
            interaction.user.id,
            interaction.guildId!,
            applicantId
          );

          await interaction.reply({
            content: '가입 신청을 수락했습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get reject(): Handler<ButtonInteraction> {
    return {
      handle: async (interaction: ButtonInteraction) => {
        try {
          const applicantId = interaction.customId.split(':')[4];

          await this.teamService.rejectApplication(
            interaction.user.id,
            interaction.guildId!,
            applicantId
          );

          await interaction.reply({
            content: '가입 신청을 거절했습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }
}