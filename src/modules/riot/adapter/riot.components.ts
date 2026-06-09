import { User as DiscordUser } from 'discord.js';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import { RiotAccount } from '../domain/riot.entity.js';

// KDA / 승률 포맷 (미집계면 '미집계')
function formatKda(account: RiotAccount): string {
  return account.kda !== null ? account.kda.toFixed(2) : '미집계';
}

function formatWinRate(account: RiotAccount): string {
  return account.winRate !== null ? `${account.winRate.toFixed(1)}%` : '미집계';
}

export function riotLinkSuccessComponents(discordUser: DiscordUser, account: RiotAccount) {
  return new ContainerBuilder()
    .setAccentColor(0x57f287)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## Riot 계정 연동 완료'),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**게임 이름:** ${account.gameName}#${account.tagLine}\n` +
          `**지역:** ${account.region}\n` +
          `**티어:** ${account.tierName ?? '배치 없음'}\n` +
          `**RR:** ${account.rr ?? 0}\n` +
          `**KDA:** ${formatKda(account)}\n` +
          `**승률:** ${formatWinRate(account)}`,
      ),
    );
}

export function riotStatsComponents(discordUser: DiscordUser, account: RiotAccount) {
  return new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## ${account.gameName}#${account.tagLine}`),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(discordUser.displayAvatarURL()),
        ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**티어:** ${account.tierName ?? '배치 없음'}\n` +
          `**RR:** ${account.rr ?? 0}\n` +
          `**KDA:** ${formatKda(account)}\n` +
          `**승률:** ${formatWinRate(account)}\n` +
          `**마지막 갱신:** ${account.lastSyncedAt?.toLocaleDateString() ?? '-'}`,
      ),
    );
}
