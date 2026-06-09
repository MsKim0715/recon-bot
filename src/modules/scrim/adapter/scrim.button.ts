import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { ScrimService } from '../domain/scrim.service.js';
import { scrimListComponents, scrimApplicationsComponents } from './scrim.components.js';

import { prisma } from '@/infra/database.js';
import { handleError } from '@/shared/errors/handle-error.js';

export class ScrimButton {
  constructor(private readonly scrimService: ScrimService) {}

  
 get listPage(): Handler<ButtonInteraction> {
  return {
    handle: async (interaction: ButtonInteraction) => {
      try {
        const page = parseInt(interaction.customId.split(':')[3]);

        const scrims = await this.scrimService.getOpenScrims(interaction.guildId!);

        const teamIds = [...new Set(scrims.map(s => s.teamId))];
        const teams = await prisma.team.findMany({
          where: { id: { in: teamIds } }
        });
        const teamNames = Object.fromEntries(teams.map(t => [t.id, t.name]));

    
        const { containers, row } = scrimListComponents(scrims, teamNames, page);

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
          const parts = interaction.customId.split(':');
          const scrimId = parts[3];
          const applicantTeamId = parts[4];

          await this.scrimService.acceptApplication(
            interaction.user.id,
            interaction.guildId!,
            scrimId,
            applicantTeamId,
          );

          await interaction.reply({
            content: '스크림 신청을 수락했습니다',
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
          const parts = interaction.customId.split(':');
          const scrimId = parts[3];
          const applicantTeamId = parts[4];

          await this.scrimService.rejectApplication(
            interaction.user.id,
            interaction.guildId!,
            scrimId,
            applicantTeamId,
          );

          await interaction.reply({
            content: '✅ 스크림 신청을 거절했습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }
}