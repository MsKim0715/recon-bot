import { User as DiscordUser } from "discord.js";
import { Team } from "../domain/team.entity.js";
import {
  buildSuccessEmbed,
  buildInfoEmbed,
} from "@/shared/embed/embed.builder.js";
import { TeamApplicationData } from "../ports/team.repository.port.js";

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

export function teamListEmbed(teams: Team[]) {
  return buildInfoEmbed({
    title: "팀 목록",
    description: teams.length === 0 ? "등록된 팀이 없습니다" : undefined,
    fields: teams.map((team) => ({
      name: team.name,
      value: team.description ?? "설명 없음",
      inline: false,
    })),
  });
}

export function teamApplicationsEmBed(applications: TeamApplicationData[]) {
  return buildInfoEmbed({
    title: "팀 가입 신청 목록",
    description: applications.length === 0 ? "신청이 없습니다" : undefined,
    fields: applications.map((app) => ({
      name: `유저 ID: ${app.userId}`,
      value: `신청일: ${app.createdAt.toLocaleDateString()}`,
      inline: false,
    })),
  });
}
