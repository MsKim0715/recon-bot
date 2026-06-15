import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { COMMANDS } from '@/bot/constants/commands.js';
import { Handler } from '@/bot/routers/base.router.js';
import { MatchService } from '../domain/match.service.js';
import { buildMatchHubPayload } from './match.hub.js';
import { handleError } from '@/shared/errors/handle-error.js';

export const matchListCommandDef = new SlashCommandBuilder()
  .setName(COMMANDS.MATCH_LIST)
  .setDescription('Open match hub')
  .setNameLocalizations({ ko: '경기목록' })
  .setDescriptionLocalizations({ ko: '내 경기 목록을 보고 결과를 입력합니다' });

export class MatchCommand {
  constructor(private readonly matchService: MatchService) {}

  // 경기의 단일 진입점(허브). 결과 입력/노쇼/승인/거절을 전부 상태별 버튼으로 처리.
  get list(): Handler<ChatInputCommandInteraction> {
    return {
      handle: async (interaction: ChatInputCommandInteraction) => {
        try {
          const { components } = await buildMatchHubPayload(
            this.matchService,
            interaction.guildId!,
            interaction.user.id,
            0,
          );

          await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components,
          });
        } catch (e) {
          await handleError(interaction, e);
        }
      },
    };
  }
}