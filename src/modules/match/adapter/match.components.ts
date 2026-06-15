import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { MatchView, MatchResultData } from '../port/match.repository.port.js';
import { BUTTONS } from '@/bot/constants/buttons.js';

const PAGE_SIZE = 3;

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: '예정',
  ONGOING: '승인 대기',
  COMPLETED: '완료',
  NO_SHOW: '노쇼',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, number> = {
  SCHEDULED: 0x5865f2,
  ONGOING: 0xfee75c,
  COMPLETED: 0x57f287,
  NO_SHOW: 0xed4245,
  CANCELLED: 0x99aab5,
};

function renderSetLines(result: MatchResultData): string {
  if (result.sets.length === 0) return '세트 정보 없음';
  return result.sets
    .map((s) => `${s.setNumber}세트  ${s.homeScore} : ${s.awayScore}`)
    .join('\n');
}

function pageRow(page: number, totalPages: number) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTONS.MATCH_LIST}:${page - 1}`)
      .setLabel('◀ 이전')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`${BUTTONS.MATCH_LIST}:page`)
      .setLabel(`${page + 1} / ${totalPages || 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`${BUTTONS.MATCH_LIST}:${page + 1}`)
      .setLabel('다음 ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

export function matchListComponents(matches: MatchView[], page = 0) {
  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageItems = matches.slice(start, start + PAGE_SIZE);

  const header = new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 내 경기 목록  (${matches.length}개)`),
    );

  if (pageItems.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('경기가 없습니다'));
    return { containers: [header], row: pageRow(page, totalPages) };
  }

  const cards = pageItems.map((m) => {
    const card = new ContainerBuilder()
      .setAccentColor(STATUS_COLOR[m.status] ?? 0x5865f2)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**#${m.scrimNumber} ${m.homeTeamName} vs ${m.awayTeamName}**  ·  ${STATUS_LABEL[m.status] ?? m.status}`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      );

    let body = `**일정:** ${m.scheduledAt.toLocaleString('ko-KR')}`;
    if (m.result) {
      body +=
        `\n**세트 스코어:** ${m.result.homeSetsWon} : ${m.result.awaySetsWon}\n` +
        renderSetLines(m.result);
    }
    card.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
    return card;
  });

  return { containers: [header, ...cards], row: pageRow(page, totalPages) };
}

// 결과 입력 직후 — 상대 팀 승인/거절 버튼 포함 (공개 메시지)
export function matchPendingComponents(match: MatchView) {
  const r = match.result;
  const container = new ContainerBuilder()
    .setAccentColor(0xfee75c)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 경기 결과 입력됨 — 상대 팀 승인 대기'),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**#${match.scrimNumber} ${match.homeTeamName} vs ${match.awayTeamName}**\n` +
          (r ? `**세트 스코어:** ${r.homeSetsWon} : ${r.awaySetsWon}\n${renderSetLines(r)}` : ''),
      ),
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTONS.MATCH_APPROVE}:${match.id}`)
      .setLabel('승인')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${BUTTONS.MATCH_REJECT}:${match.id}`)
      .setLabel('거절')
      .setStyle(ButtonStyle.Danger),
  );

  return { container, row };
}

// 승인 완료
export function matchConfirmedComponents(match: MatchView) {
  const r = match.result;
  const winnerName = r
    ? r.winnerId === match.homeTeamId
      ? match.homeTeamName
      : match.awayTeamName
    : '-';

  return new ContainerBuilder()
    .setAccentColor(0x57f287)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 경기 결과 확정'))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**#${match.scrimNumber} ${match.homeTeamName} vs ${match.awayTeamName}**\n` +
          (r
            ? `**세트 스코어:** ${r.homeSetsWon} : ${r.awaySetsWon}\n${renderSetLines(r)}\n**승리:** ${winnerName}`
            : ''),
      ),
    );
}

// 거절됨
export function matchRejectedComponents() {
  return new ContainerBuilder()
    .setAccentColor(0xed4245)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 경기 결과 거절됨'))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('입력된 결과가 거절되었습니다. 다시 입력해주세요.'),
    );
}


/* ───────────────────────────────────────────────────────────
 *  HUB  (개인용 ephemeral — 상태별 클릭 버튼)
 * ─────────────────────────────────────────────────────────── */

type HubComponent = ContainerBuilder | ActionRowBuilder<ButtonBuilder>;

// matches 는 getMyMatches 로 리더 스코프. viewerTeamId 로 ONGOING 승인 버튼을 분기.
export function matchHubComponents(
  matches: MatchView[],
  viewerTeamId: string | null,
  page = 0,
): { components: HubComponent[] } {
  const totalPages = Math.ceil(matches.length / PAGE_SIZE) || 1;
  const start = page * PAGE_SIZE;
  const pageItems = matches.slice(start, start + PAGE_SIZE);

  const components: HubComponent[] = [];

  const header = new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 내 경기  (${matches.length}개)`),
    );
  components.push(header);

  if (pageItems.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('경기가 없습니다'));
    return { components };
  }

  for (const m of pageItems) {
    const card = new ContainerBuilder()
      .setAccentColor(STATUS_COLOR[m.status] ?? 0x5865f2)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**#${m.scrimNumber} ${m.homeTeamName} vs ${m.awayTeamName}**  ·  ${STATUS_LABEL[m.status] ?? m.status}`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      );

    let body = `**일정:** ${m.scheduledAt.toLocaleString('ko-KR')}`;
    if (m.result) {
      body +=
        `\n**세트 스코어:** ${m.result.homeSetsWon} : ${m.result.awaySetsWon}\n` +
        renderSetLines(m.result);
    }
    card.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

    if (m.status === 'SCHEDULED') {
      card.addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`${BUTTONS.MATCH_RESULT_OPEN}:${m.id}`)
            .setLabel('결과 입력')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`${BUTTONS.MATCH_NOSHOW}:${m.id}`)
            .setLabel('노쇼 신고')
            .setStyle(ButtonStyle.Danger),
        ),
      );
    } else if (m.status === 'ONGOING') {
      const iSubmitted =
        m.result !== null && viewerTeamId !== null && m.result.submittedBy === viewerTeamId;
      if (iSubmitted) {
        card.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('_상대 팀 승인 대기 중_'),
        );
      } else {
        card.addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`${BUTTONS.MATCH_APPROVE}:${m.id}`)
              .setLabel('승인')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`${BUTTONS.MATCH_REJECT}:${m.id}`)
              .setLabel('거절')
              .setStyle(ButtonStyle.Danger),
          ),
        );
      }
    }
    // COMPLETED / NO_SHOW / CANCELLED → 버튼 없이 결과만

    components.push(card);
  }

  components.push(pageRow(page, totalPages));
  return { components };
}


/* ───────────────────────────────────────────────────────────
 *  스케줄러 DM 카드
 * ─────────────────────────────────────────────────────────── */

// 시작 1분 전
export function matchReminderComponents(
  scrimNumber: number,
  homeTeamName: string,
  awayTeamName: string,
  scheduledAt: Date,
) {
  return new ContainerBuilder()
    .setAccentColor(0xfee75c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 경기 시작 1분 전'))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**#${scrimNumber} ${homeTeamName} vs ${awayTeamName}**\n` +
          `**일정:** ${scheduledAt.toLocaleString('ko-KR')}\n\n곧 경기가 시작됩니다`,
      ),
    );
}

// 시작 시간 지났는데 결과 미입력
export function matchNoResultWarningComponents(
  scrimNumber: number,
  homeTeamName: string,
  awayTeamName: string,
  scheduledAt: Date,
) {
  return new ContainerBuilder()
    .setAccentColor(0xed4245)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 경기 결과 미입력'))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**#${scrimNumber} ${homeTeamName} vs ${awayTeamName}**\n` +
          `**일정:** ${scheduledAt.toLocaleString('ko-KR')}\n\n` +
          '경기 결과가 아직 입력되지 않았습니다.\n' +
          '`/경기목록` 에서 결과를 입력하거나, 상대가 오지 않았다면 노쇼로 신고해주세요.',
      ),
    );
}