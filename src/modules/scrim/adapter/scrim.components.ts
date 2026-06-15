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


/* ───────────────────────────────────────────────────────────
 *  HUB  (개인용 ephemeral 패널 — 역할별 버튼)
 * ─────────────────────────────────────────────────────────── */

type HubComponent = ContainerBuilder | ActionRowBuilder<ButtonBuilder>;

export function scrimHubComponents(
  scrims: Scrim[],
  teamNames: Record<string, string>,
  viewerLeaderTeamId: string | null,
  page: number = 0,
): { components: HubComponent[] } {
  const totalPages = Math.ceil(scrims.length / PAGE_SIZE) || 1;
  const start = page * PAGE_SIZE;
  const pageScrims = scrims.slice(start, start + PAGE_SIZE);

  const components: HubComponent[] = [];

  // 헤더 + 상단 액션 ([스크림 모집] [내 신청])
  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 스크림  (${scrims.length}개 모집 중)`)
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('button:scrim:createopen')
          .setLabel('스크림 모집')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('button:scrim:myapps')
          .setLabel('내 신청')
          .setStyle(ButtonStyle.Secondary),
      ),
    );
  components.push(header);

  if (pageScrims.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('모집 중인 스크림이 없습니다')
      );
    return { components };
  }

  for (const scrim of pageScrims) {
    const isMine = viewerLeaderTeamId !== null && scrim.teamId === viewerLeaderTeamId;
    const accent = scrim.hasTierLimit() ? getTierColor(scrim.minTier!) : 0x5865F2;

    const card = new ContainerBuilder()
      .setAccentColor(accent)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**#${scrim.number} ${teamNames[scrim.teamId] ?? '알 수 없음'}**` +
          (isMine ? '  ·  내 모집글' : '')
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
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

    if (isMine) {
      card.addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button:scrim:applist:${scrim.number}`)
            .setLabel('신청 목록')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`button:scrim:close:${scrim.number}`)
            .setLabel('마감')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`button:scrim:cancel:${scrim.number}`)
            .setLabel('취소')
            .setStyle(ButtonStyle.Danger),
        ),
      );
    } else {
      card.addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button:scrim:applyopen:${scrim.number}`)
            .setLabel('신청')
            .setStyle(ButtonStyle.Success),
        ),
      );
    }

    components.push(card);
  }

  // 페이지네이션 (최상위 액션 로우)
  components.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`button:scrim:list:${page - 1}`)
        .setLabel('◀ 이전')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('button:scrim:list:page')
        .setLabel(`${page + 1} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`button:scrim:list:${page + 1}`)
        .setLabel('다음 ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
    ),
  );

  return { components };
}

// [내 신청] — 내가 신청한(PENDING) 스크림 + 각 카드 [신청 취소]
const MAX_MY_APPS = 5;

export function scrimMyApplicationsComponents(
  scrims: Scrim[],
  teamNames: Record<string, string>,
): { components: HubComponent[] } {
  const components: HubComponent[] = [];

  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 내 신청  (${scrims.length}건)`)
    );
  components.push(header);

  if (scrims.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('신청 중인 스크림이 없습니다')
      );
    return { components };
  }

  const shown = scrims.slice(0, MAX_MY_APPS);

  if (scrims.length > MAX_MY_APPS) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`최근 ${MAX_MY_APPS}건만 표시됩니다`)
      );
  }

  for (const scrim of shown) {
    components.push(
      new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**#${scrim.number} ${teamNames[scrim.teamId] ?? '알 수 없음'}**`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**일정:** ${scrim.scheduledAt.toLocaleString('ko-KR')}`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`button:scrim:unapply:${scrim.number}`)
              .setLabel('신청 취소')
              .setStyle(ButtonStyle.Danger),
          ),
        ),
    );
  }

  return { components };
}


/* ───────────────────────────────────────────────────────────
 *  PUSH 알림 (모집팀 리더 DM)
 * ─────────────────────────────────────────────────────────── */

// 신청이 들어왔을 때 모집팀 리더에게 DM 으로 보내는 카드.
// 수락/거절 버튼 customId 에 guildId 를 포함시켜 DM(길드 컨텍스트 없음)에서도 동작하게 함.
export function scrimApplicationNotificationComponents(
  scrim: Scrim,
  recruitingTeamName: string,
  applicantTeamName: string,
  applicantTeamId: string,
  guildId: string,
) {
  return new ContainerBuilder()
    .setAccentColor(0xFEE75C)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 새 스크림 신청')
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**모집글:** #${scrim.number} ${recruitingTeamName}\n` +
        `**신청 팀:** ${applicantTeamName}\n` +
        `**일정:** ${scrim.scheduledAt.toLocaleString('ko-KR')}`
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`button:scrim:accept:${scrim.id}:${applicantTeamId}:${guildId}`)
          .setLabel('수락')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`button:scrim:reject:${scrim.id}:${applicantTeamId}:${guildId}`)
          .setLabel('거절')
          .setStyle(ButtonStyle.Danger),
      ),
    );
}

// DM 알림에서 수락/거절을 누른 뒤 메시지를 갱신할 때 쓰는 결과 카드 (버튼 제거)
export function scrimNotificationResultComponents(result: '수락' | '거절') {
  const color = result === '수락' ? 0x57F287 : 0xED4245;
  return new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`스크림 신청을 **${result}**했습니다`)
    );
}

export function scrimMatchedNotificationComponents(
  scrimNumber: number,
  recruitingTeamName: string,
  applicantTeamName: string,
  scheduledAt: Date,
) {
  return new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 스크림 수락됨 — 경기가 잡혔습니다')
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**경기:** #${scrimNumber} ${recruitingTeamName} vs ${applicantTeamName}\n` +
        `**일정:** ${scheduledAt.toLocaleString('ko-KR')}\n\n` +
        '`/경기목록` 에서 결과를 입력할 수 있어요'
      )
    );
}