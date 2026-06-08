import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Scrim } from '../domain/scrim.entity.js';
import { ScrimApplicationData } from '../port/scrim.repository.port.js';
import { getTierColor } from '@/shared/utils/tier-colors.utils.js';


const PAGE_SIZE = 3;

const TIER_NAMES: Record<number, string> = {
  0: 'Unrated',
  1: 'Iron 1', 2: 'Iron 2', 3: 'Iron 3',
  4: 'Bronze 1', 5: 'Bronze 2', 6: 'Bronze 3',
  7: 'Silver 1', 8: 'Silver 2', 9: 'Silver 3',
  10: 'Gold 1', 11: 'Gold 2', 12: 'Gold 3',
  13: 'Platinum 1', 14: 'Platinum 2', 15: 'Platinum 3',
  16: 'Diamond 1', 17: 'Diamond 2', 18: 'Diamond 3',
  19: 'Ascendant 1', 20: 'Ascendant 2', 21: 'Ascendant 3',
  22: 'Immortal 1', 23: 'Immortal 2', 24: 'Immortal 3',
  25: 'Radiant',
};

export function scrimCreatedComponents(scrim: Scrim, teamName: string) {
  return new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 스크림 모집 생성 완료')
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**팀:** ${teamName}\n` +
        `**일정:** ${scrim.scheduledAt.toLocaleString('ko-KR')}\n` +
        `**설명:** ${scrim.description ?? '없음'}\n` +
        `**티어 제한:** ${scrim.hasTierLimit()
          ? `${TIER_NAMES[scrim.minTier!]} ~ ${TIER_NAMES[scrim.maxTier!]}`
          : '없음'
        }`
      )
    );
}

export function scrimListComponents(
  scrims: Scrim[],
  teamNames: Record<string, string>,
  page: number = 0
) {
  const totalPages = Math.ceil(scrims.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageScrims = scrims.slice(start, end);

  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 스크림 목록  (${scrims.length}개)`
      )
    );

  if (pageScrims.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('모집 중인 스크림이 없습니다')
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`button:scrim:list:${page - 1}`)
        .setLabel('◀ 이전')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`button:scrim:list:page`)
        .setLabel(`${page + 1} / ${totalPages || 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`button:scrim:list:${page + 1}`)
        .setLabel('다음 ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );

    return { containers: [header], row };
  }

  const scrimContainers = pageScrims.map(scrim => {
    const accentColor = scrim.hasTierLimit()
      ? getTierColor(scrim.minTier!)
      : 0x5865F2;

    return new ContainerBuilder()
      .setAccentColor(accentColor)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**#${scrim.number} ${teamNames[scrim.teamId] ?? '알 수 없음'}**`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**일정:** ${scrim.scheduledAt.toLocaleString('ko-KR')}\n` +
          `**설명:** ${scrim.description ?? '없음'}\n` +
          `**티어 제한:** ${scrim.hasTierLimit()
            ? `${TIER_NAMES[scrim.minTier!]} ~ ${TIER_NAMES[scrim.maxTier!]}`
            : '없음'
          }`
        )
      );
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`button:scrim:list:${page - 1}`)
      .setLabel('◀ 이전')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`button:scrim:list:page`)
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`button:scrim:list:${page + 1}`)
      .setLabel('다음 ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );

  return { containers: [header, ...scrimContainers], row };
}

export function scrimApplicationsComponents(
  applications: ScrimApplicationData[],
  scrimId: string
) {
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 스크림 신청 목록')
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    );

  if (applications.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('신청이 없습니다')
    );
    return { container, rows: [] };
  }

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  applications.forEach(app => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**팀:** ${app.teamName}\n` +
        `**평균 티어:** ${app.avgTierName ?? '미집계'}\n` +
        `**메시지:** ${app.message ?? '없음'}`
      )
    );

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`button:scrim:accept:${scrimId}:${app.teamId}`)
          .setLabel('수락')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`button:scrim:reject:${scrimId}:${app.teamId}`)
          .setLabel('거절')
          .setStyle(ButtonStyle.Danger),
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(false)
        .setSpacing(SeparatorSpacingSize.Small)
    );
  });

  return { container, rows };
}