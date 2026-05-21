import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { TeamService } from '../domain/team.service.js';
import { teamCreatedComponents, teamUpdatedComponents } from './team.components.js';
import { handleError } from '@/shared/errors/handle-error.js';

export class TeamModal {
  constructor(private readonly teamService: TeamService) {}

  get create(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          const name = interaction.fields.getTextInputValue('name');
          const description = interaction.fields.getTextInputValue('description') || null;

          const team = await this.teamService.create(
            interaction.user.id,
            interaction.guildId!,
            name,
            description
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [teamCreatedComponents(interaction.user, team)],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }


  get update(): Handler<ModalSubmitInteraction> {
    return {
      handle: async (interaction: ModalSubmitInteraction) => {
        try {
          const name = interaction.fields.getTextInputValue('name');
          const description = interaction.fields.getTextInputValue('description') || null;

          const team = await this.teamService.updateTeam(
            interaction.user.id,
            interaction.guildId!,
            name,
            description
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [teamUpdatedComponents(team)],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }
}