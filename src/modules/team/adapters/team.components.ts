import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  User as DiscordUser,
} from 'discord.js';
import { Team } from '../domain/team.entity.js';
import { TeamApplicationData, TeamDetailData } from '../ports/team.repository.port.js';
import { getTierColor } from '@/shared/utils/tier-colors.utils.js';

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

export function teamProfileComponents(detail: TeamDetailData) {
  const { team, members, avgTier, avgTierName, winCount, loseCount } = detail;

  const accentColor = avgTier !== null ? getTierColor(avgTier) : 0x5865F2;

  const memberText = members.length > 0
    ? members.map(m =>
        `- **${m.username}** : ${m.tierName ?? '미연동'}`
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

export function teamListComponents(teams: Team[]) {
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 팀 목록')
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    );

  if (teams.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('등록된 팀이 없습니다')
    );
    return container;
  }

  teams.forEach(team => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${team.name}** ${team.description ?? ''}`
      )
    );
  });

  return container;
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
        `**유저 ID:** ${app.userId}\n` +
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

