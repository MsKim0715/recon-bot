import { User as DiscordUser } from "discord.js";
import { Team } from "../domain/team.entity.js";
import {
  buildSuccessEmbed,
  buildInfoEmbed,
} from "@/shared/embed/embed.builder.js";

export function teamCreatedEmbed(discordUser: DiscordUser, team: Team) {
  return buildSuccessEmbed(discordUser, {
    title: "팀 생성 완료",
    fields: [
      { name: "팀 이름", value: team.name, inline: true },
      { name: "설명", value: team.description ?? "없음", inline: true },
    ],
  });
}

export function teamProfileEmbed(team: Team) {
  return buildInfoEmbed({
    title: `${team.name} 팀 정보`,
    fields: [
      {
        name: "평균 티어",
        value: team.stats?.avgTierName ?? "미집계",
        inline: true,
      },
      {
        name: "평균 승률",
        value: team.stats?.avgWinRate ? `${team.stats.avgWinRate}%` : "미집계",
        inline: true,
      },
      {
        name: "평균 KDA",
        value: team.stats?.avgKda?.toString() ?? "미집계",
        inline: true,
      },
      { name: "노쇼 횟수", value: `${team.noShowCount}회`, inline: true },
      {
        name: "스크림 신청",
        value: team.canApplyScrim() ? "가능" : "불가 (노쇼 패널티)",
        inline: true,
      },
    ],
  });
}
