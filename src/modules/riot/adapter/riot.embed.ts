import {User as DiscordUser } from 'discord.js';
import { RiotAccount } from '../domain/riot.entity.js'; 
import { buildSuccessEmbed, buildInfoEmbed } from '@/shared/embed/embed.builder.js';

export function riotLinkSuccessEmbed(discordUser: DiscordUser, account: RiotAccount) {
  return buildSuccessEmbed(discordUser, {
    title: 'Riot 계정 연동 완료',
    fields: [
      { name: '게임 이름', value: `${account.gameName}#${account.tagLine}`, inline: true },
      { name: '지역', value: account.region, inline: true },
      { name: '티어', value: account.tierName ?? '배치 없음', inline: true },
      { name: 'RR', value: `${account.rr ?? 0}`, inline: true },
    ]
  });
}

export function riotStatsEmbed(discordUser: DiscordUser, account: RiotAccount) {
  return buildInfoEmbed({
    title: `${account.gameName}#${account.tagLine}`,
    thumbnail: discordUser.displayAvatarURL(),
    fields: [
      { name: '티어', value: account.tierName ?? '배치 없음', inline: true },
      { name: 'RR', value: `${account.rr ?? 0}`, inline: true },
      { name: '마지막 갱신', value: account.lastSyncedAt?.toLocaleDateString() ?? '-', inline: true },
    ]
  });
}