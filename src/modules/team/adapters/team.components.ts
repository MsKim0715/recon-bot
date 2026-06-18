import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  User as DiscordUser,
} from 'discord.js';
import { Team } from '../domain/team.entity.js';
import { TeamApplicationData, TeamDetailData, TeamMemberData } from '../ports/team.repository.port.js';
import { getTierColor } from '@/shared/utils/tier-colors.utils.js';


const PAGE_SIZE = 3;

export function teamCreatedComponents(discordUser: DiscordUser, team: Team) {
  return new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## 팀 생성 완료'),
          new TextDisplayBuilder().setContent(`**${team.name}**`),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(discordUser.displayAvatarURL())
        )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**설명:** ${team.description ?? '없음'}`
      )
    );
}

export function teamUpdatedComponents(team: Team) {
  return new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 팀 정보 수정 완료'),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**팀명:** ${team.name}\n` +
        `**설명:** ${team.description ?? '없음'}`
      )
    );
}

export function teamTransferredComponents(targetUsername: string) {
  return new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 리더 양도 완료'),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${targetUsername}** 님에게 리더를 양도했습니다`
      )
    );
}

export function teamProfileComponents(detail: TeamDetailData) {
  const { team, members, avgTier, avgTierName, winCount, loseCount } = detail;

  const accentColor = avgTier !== null ? getTierColor(avgTier) : 0x5865F2;

  const memberText = members.length > 0
    ? members.map(m =>
        `- **${m.username}** ${m.tierName ?? '미연동'}`
      ).join('\n')
    : '팀원이 없습니다';

  return new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${team.name}`),
      new TextDisplayBuilder().setContent(
        `**설명:** ${team.description ?? '없음'}`
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**평균 티어:** ${avgTierName ?? '미집계'}\n` +
        `**전적:** ${winCount}승 ${loseCount}패\n` +
        `**노쇼:** ${team.noShowCount}회`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**팀원 (${members.length}명)**\n${memberText}`
      )
    );
}


export function teamListComponents(teams: Team[], page: number = 0) {
  const totalPages = Math.ceil(teams.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageTeams = teams.slice(start, end);

  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 팀 목록  (${teams.length}개)`
      )
    );

  if (pageTeams.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('등록된 팀이 없습니다')
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`button:team:list:${page - 1}`)
        .setLabel('◀ 이전')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`button:team:list:page`)
        .setLabel(`${page + 1} / ${totalPages || 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`button:team:list:${page + 1}`)
        .setLabel('다음 ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );

    return { containers: [header], row };
  }

  const teamContainers = pageTeams.map(team =>
    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${team.name}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**설명:** ${team.description ?? '없음'}\n` +
          `**노쇼:** ${team.noShowCount}회`
        )
      )
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`button:team:list:${page - 1}`)
      .setLabel('◀ 이전')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`button:team:list:page`)
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`button:team:list:${page + 1}`)
      .setLabel('다음 ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );

  return { containers: [header, ...teamContainers], row };
}


export function teamApplicationsComponents(applications: TeamApplicationData[]) {
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 팀 가입 신청 목록')
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
    return container;
  }

  applications.forEach(app => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**유저 ID:** ${app.username}\n` +
        `**신청일:** ${app.createdAt.toLocaleDateString()}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(false)
        .setSpacing(SeparatorSpacingSize.Small)
    );
  });

  return container;
}


/* ───────────────────────────────────────────────────────────
 *  HUB  (개인용 ephemeral — 역할 인식)
 * ─────────────────────────────────────────────────────────── */

type HubComponent = ContainerBuilder | ActionRowBuilder<ButtonBuilder>;

// 팀 보유자(리더/멤버)용 허브: 프로필 + 역할별 버튼
export function teamHubComponents(
  detail: TeamDetailData,
  role: 'LEADER' | 'MEMBER',
): { components: HubComponent[] } {
  const container = teamProfileComponents(detail);

  if (role === 'LEADER') {
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('button:team:updateopen')
          .setLabel('팀 정보 수정')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('button:team:members')
          .setLabel('멤버 관리')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('button:team:pending')
          .setLabel('가입 신청 목록')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('button:team:disband')
          .setLabel('팀 해체')
          .setStyle(ButtonStyle.Danger),
      ),
    );
  } else {
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('button:team:leave')
          .setLabel('팀 탈퇴')
          .setStyle(ButtonStyle.Danger),
      ),
    );
  }

  return { components: [container] };
}

// 무소속 로비: [팀 생성][팀 목록] + 내 가입 신청(있으면) 각 [신청 취소]
const MAX_MY_APPS = 5;

export function teamLobbyComponents(
  myApplications: { teamId: string; teamName: string; createdAt: Date }[],
): { components: HubComponent[] } {
  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 팀'),
      new TextDisplayBuilder().setContent('소속된 팀이 없습니다'),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('button:team:createopen')
          .setLabel('팀 생성')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('button:team:browse')
          .setLabel('팀 목록')
          .setStyle(ButtonStyle.Secondary),
      ),
    );

  const components: HubComponent[] = [header];

  for (const app of myApplications.slice(0, MAX_MY_APPS)) {
    components.push(
      new ContainerBuilder()
        .setAccentColor(0xFEE75C)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**가입 신청:** ${app.teamName}\n` +
            `**신청일:** ${app.createdAt.toLocaleDateString('ko-KR')}`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`button:team:unapply:${app.teamId}`)
              .setLabel('신청 취소')
              .setStyle(ButtonStyle.Danger),
          ),
        ),
    );
  }

  return { components };
}

// [멤버 관리] 패널: 리더 제외 멤버마다 [추방][위임]
export function teamMembersComponents(
  members: TeamMemberData[],
  leaderDiscordId: string,
  teamName: string,
): { components: HubComponent[] } {
  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 멤버 관리 — ${teamName}`)
    );

  const others = members.filter(m => m.userId !== leaderDiscordId);

  if (others.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('관리할 팀원이 없습니다')
      );
    return { components: [header] };
  }

  const components: HubComponent[] = [header];

  for (const m of others) {
    components.push(
      new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**${m.username}**  ${m.tierName ?? '미연동'}`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`button:team:kick:${m.userId}`)
              .setLabel('추방')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`button:team:transfer:${m.userId}`)
              .setLabel('위임')
              .setStyle(ButtonStyle.Secondary),
          ),
        ),
    );
  }

  return { components };
}

// [팀 목록]: 각 팀 카드에 [가입 신청] 버튼. 무소속 viewer 용.
export function teamJoinListComponents(
  teams: Team[],
  page: number = 0,
): { components: HubComponent[] } {
  const totalPages = Math.ceil(teams.length / PAGE_SIZE) || 1;
  const start = page * PAGE_SIZE;
  const pageTeams = teams.slice(start, start + PAGE_SIZE);

  const header = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 팀 목록  (${teams.length}개)`)
    );

  const components: HubComponent[] = [header];

  if (pageTeams.length === 0) {
    header
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('등록된 팀이 없습니다')
      );
    return { components };
  }

  for (const team of pageTeams) {
    components.push(
      new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${team.name}**`)
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**설명:** ${team.description ?? '없음'}\n` +
            `**노쇼:** ${team.noShowCount}회`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`button:team:joinopen:${team.id}`)
              .setLabel('가입 신청')
              .setStyle(ButtonStyle.Success),
          ),
        ),
    );
  }

  components.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`button:team:list:${page - 1}`)
        .setLabel('◀ 이전')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('button:team:list:page')
        .setLabel(`${page + 1} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`button:team:list:${page + 1}`)
        .setLabel('다음 ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
    ),
  );

  return { components };
}