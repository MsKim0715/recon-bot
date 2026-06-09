import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  MessageFlags,
} from 'discord.js';
import { COMMANDS } from '@/bot/constants/commands.js';
import { Handler } from '@/bot/routers/base.router.js';
import { ScrimService } from '../domain/scrim.service.js';
import { buildScrimCreateModal, buildScrimApplyModal } from './scrim.modal-ui.js';
import { scrimListComponents, scrimApplicationsComponents } from './scrim.components.js';

import { prisma } from '@/infra/database.js';
import { Scrim } from '../domain/scrim.entity.js';
import { handleError } from '@/shared/errors/handle-error.js';

export const scrimCreateCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_CREATE)
  .setDescription('Create a scrim')
  .setNameLocalizations({ ko: '스크림생성' })
  .setDescriptionLocalizations({ ko: '스크림 모집글을 생성합니다' });

export const scrimListCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_LIST)
  .setDescription('View scrim list')
  .setNameLocalizations({ ko: '스크림목록' })
  .setDescriptionLocalizations({ ko: '스크림 목록을 조회합니다' });

export const scrimApplyCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_APPLY)
  .setDescription('Apply for a scrim')
  .setNameLocalizations({ ko: '스크림신청' })
  .setDescriptionLocalizations({ ko: '스크림을 신청합니다' })
  .addStringOption(option =>
    option
      .setName('scrim')
      .setNameLocalizations({ ko: '스크림' })
      .setDescription('신청할 스크림')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const scrimPendingCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_PENDING)
  .setDescription('View scrim applications')
  .setNameLocalizations({ ko: '스크림신청목록' })
  .setDescriptionLocalizations({ ko: '스크림 신청 목록을 조회합니다' })
  .addStringOption(option =>
    option
      .setName('scrim')
      .setNameLocalizations({ ko: '스크림' })
      .setDescription('조회할 스크림')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const scrimCloseCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_CLOSE)
  .setDescription('Close scrim')
  .setNameLocalizations({ ko: '스크림마감' })
  .setDescriptionLocalizations({ ko: '스크림 모집을 마감합니다' })
  .addStringOption(option =>
    option
      .setName('scrim')
      .setNameLocalizations({ ko: '스크림' })
      .setDescription('마감할 스크림')
      .setRequired(true)
      .setAutocomplete(true)
  );



export const scrimCancelCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_CANCEL)
  .setDescription('Cancel scrim')
  .setNameLocalizations({ ko: '스크림취소' })
  .setDescriptionLocalizations({ ko: '스크림을 취소합니다' })
  .addStringOption(option =>
    option
      .setName('scrim')
      .setNameLocalizations({ ko: '스크림' })
      .setDescription('취소할 스크림')
      .setRequired(true)
      .setAutocomplete(true)
  );


export const scrimApplyCancelCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.SCRIM_APPLY_CANCEL)
  .setDescription('Cancel scrim application')
  .setNameLocalizations({ ko: '스크림신청취소' })
  .setDescriptionLocalizations({ ko: '스크림 신청을 취소합니다' })
  .addStringOption(option =>
    option
      .setName('scrim')
      .setNameLocalizations({ ko: '스크림' })
      .setDescription('신청 취소할 스크림')
      .setRequired(true)
      .setAutocomplete(true)
  );

export class ScrimCommand {
  constructor(private readonly scrimService: ScrimService) {}

  get create(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        await interaction.showModal(buildScrimCreateModal());
      }
    };
  }

  get list(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const scrims = await this.scrimService.getOpenScrims(interaction.guildId!);

          const teamIds = [...new Set(scrims.map(s => s.teamId))];
          const teams = await prisma.team.findMany({
            where: { id: { in: teamIds } }
          });
          const teamNames = Object.fromEntries(teams.map(t => [t.id, t.name]));

          const { containers, row } = scrimListComponents(scrims, teamNames, 0);

          await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [...containers, row],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get apply(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.options.getString('scrim', true));
          await interaction.showModal(buildScrimApplyModal(scrimNumber));
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await handleError(interaction, e);
          }
        }
      }
    };
  }

  get pending(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.options.getString('scrim', true));
          const applications = await this.scrimService.getApplications(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );

          const scrim = await this.scrimService.getScrimByNumber(scrimNumber, interaction.guildId!);
          const { container, rows } = scrimApplicationsComponents(applications, scrim.id);

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container, ...rows],
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

  get close(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.options.getString('scrim', true));

          await this.scrimService.closeScrim(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );

          await interaction.reply({
            content: '✅ 스크림 모집이 마감됐습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }


  get cancel(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.options.getString('scrim', true));

          await this.scrimService.cancelScrim(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );

          await interaction.reply({
            content: '스크림이 취소됐습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }


  get applyCancel(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const scrimNumber = parseInt(interaction.options.getString('scrim', true));

          await this.scrimService.cancelApplication(
            interaction.user.id,
            interaction.guildId!,
            scrimNumber,
          );

          await interaction.reply({
            content: '스크림 신청이 취소됐습니다',
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      }
    };
  }

 // 공통 로직 추출
private async buildScrimAutocomplete(
  interaction: AutocompleteInteraction,
  scrims: Scrim[]
): Promise<void> {
  const teamIds = [...new Set(scrims.map(s => s.teamId))];
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } }
  });
  const teamNames = Object.fromEntries(teams.map(t => [t.id, t.name]));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = scrims
    .filter(s => {
      const teamName = teamNames[s.teamId] ?? '';
      return (
        teamName.toLowerCase().includes(focused) ||
        s.number.toString().includes(focused)
      );
    })
    .map(s => ({
      name: `#${s.number} ${teamNames[s.teamId] ?? '알 수 없음'} | ${s.scheduledAt.toLocaleString('ko-KR')}`,
      value: s.number.toString(),
    }));

  await interaction.respond(filtered.slice(0, 25));
}

// 각 autocomplete → 데이터 조회만 다름
get scrimAutocomplete() {
  return {
    handle: async (interaction: AutocompleteInteraction) => {
      try {
        const scrims = await this.scrimService.getOpenScrims(interaction.guildId!);
        await this.buildScrimAutocomplete(interaction, scrims);
      } catch {
        await interaction.respond([]);
      }
    }
  };
}

get myScrimAutocomplete() {
  return {
    handle: async (interaction: AutocompleteInteraction) => {
      try {
        const scrims = await this.scrimService.getMyScrimsByLeader(
          interaction.user.id,
          interaction.guildId!
        );
        await this.buildScrimAutocomplete(interaction, scrims);
      } catch {
        await interaction.respond([]);
      }
    }
  };
}

get myApplicationAutocomplete() {
  return {
    handle: async (interaction: AutocompleteInteraction) => {
      try {
        const scrims = await this.scrimService.getMyApplicationScrims(
          interaction.user.id,
          interaction.guildId!
        );
        await this.buildScrimAutocomplete(interaction, scrims);
      } catch {
        await interaction.respond([]);
      }
    }
  };
}


}