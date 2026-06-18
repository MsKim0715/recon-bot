import { prisma } from "@/infra/database.js";
import { Team } from "../domain/team.entity.js";
import {
  TeamRepositoryPort,
  TeamApplicationData,
  TeamDetailData,
  TeamMemberData,
} from "../ports/team.repository.port.js";
import {
  Team as PrismaTeam,
  ApplicationStatus,
} from "@/generated/prisma/index.js";

export class PrismaTeamRepository implements TeamRepositoryPort {
  async hasActiveMatch(teamId: string): Promise<boolean> {
    const count = await prisma.match.count({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: { in: ["SCHEDULED", "ONGOING"] },
      },
    });
    return count > 0;
  }
  private async resolveUserId(
    discordId: string,
    guildId: string,
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { discordId_guildId: { discordId, guildId } },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async findMembers(teamId: string): Promise<TeamMemberData[]> {
    const data = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { include: { riotAccount: true } } },
    });
    return data.map((m) => ({
      userId: m.user.discordId,
      username: m.user.username,
      tierName: m.user.riotAccount?.tierName ?? null,
      currentTier: m.user.riotAccount?.currentTier ?? null,
    }));
  }

  async findById(id: string): Promise<Team | null> {
    const data = await prisma.team.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findByName(name: string, guildId: string): Promise<Team | null> {
    const data = await prisma.team.findUnique({
      where: { name_guildId: { name, guildId } },
    });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findByLeaderId(
    leaderId: string,
    guildId: string,
  ): Promise<Team | null> {
    const data = await prisma.team.findFirst({ where: { leaderId, guildId } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAllByGuildId(guildId: string): Promise<Team[]> {
    const data = await prisma.team.findMany({ where: { guildId } });
    return data.map(this.toEntity.bind(this));
  }

  async findDetailByLeaderId(
    leaderId: string,
    guildId: string,
  ): Promise<TeamDetailData | null> {
    const data = await prisma.team.findFirst({
      where: { leaderId, guildId },
      include: {
        members: { include: { user: { include: { riotAccount: true } } } },
        homeMatches: {
          where: { status: "COMPLETED" },
          include: { result: true },
        },
        awayMatches: {
          where: { status: "COMPLETED" },
          include: { result: true },
        },
      },
    });
    if (!data) return null;

    const team = this.toEntity(data);
    const members: TeamMemberData[] = data.members.map((m) => ({
      userId: m.user.discordId,
      username: m.user.username,
      tierName: m.user.riotAccount?.tierName ?? null,
      currentTier: m.user.riotAccount?.currentTier ?? null,
    }));

    const tieredMembers = members.filter((m) => m.currentTier !== null);
    const avgTier =
      tieredMembers.length > 0
        ? tieredMembers.reduce((sum, m) => sum + (m.currentTier ?? 0), 0) /
          tieredMembers.length
        : null;
    const avgTierRounded = avgTier !== null ? Math.round(avgTier) : null;
    const avgTierName =
      avgTierRounded !== null
        ? (tieredMembers.find((m) => m.currentTier === avgTierRounded)
            ?.tierName ?? null)
        : null;

    const winCount = [
      ...data.homeMatches.filter((m) => m.result?.winnerId === data.id),
      ...data.awayMatches.filter((m) => m.result?.winnerId === data.id),
    ].length;
    const loseCount = [
      ...data.homeMatches.filter((m) => m.result?.loserId === data.id),
      ...data.awayMatches.filter((m) => m.result?.loserId === data.id),
    ].length;

    return { team, members, avgTier, avgTierName, winCount, loseCount };
  }

  async existsByName(name: string, guildId: string): Promise<boolean> {
    const count = await prisma.team.count({ where: { name, guildId } });
    return count > 0;
  }

  async existsByLeaderId(leaderId: string, guildId: string): Promise<boolean> {
    const count = await prisma.team.count({ where: { leaderId, guildId } });
    return count > 0;
  }

  async save(team: Team): Promise<void> {
    const userId = await this.resolveUserId(team.leaderId, team.guildId);
    if (!userId) throw new Error("유저를 찾을 수 없습니다");
    await prisma.$transaction([
      prisma.team.create({ data: this.toPrisma(team) }),
      prisma.teamMember.create({
        data: { teamId: team.id, userId, role: "LEADER" },
      }),
    ]);
  }

  async update(id: string, team: Team): Promise<void> {
    await prisma.team.update({ where: { id }, data: this.toPrisma(team) });
  }

  async delete(id: string): Promise<void> {
    await prisma.team.delete({ where: { id } });
  }

  async isMember(teamId: string, discordId: string): Promise<boolean> {
    const count = await prisma.teamMember.count({
      where: { teamId, user: { discordId } },
    });
    return count > 0;
  }

  async removeMember(
    teamId: string,
    discordId: string,
    guildId: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(discordId, guildId);
    if (!userId) throw new Error("유저를 찾을 수 없습니다");
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async countMembers(teamId: string): Promise<number> {
    return prisma.teamMember.count({ where: { teamId } });
  }

  async isMemberOfAnyTeam(
    discordId: string,
    guildId: string,
  ): Promise<boolean> {
    const count = await prisma.teamMember.count({
      where: { user: { discordId, guildId }, team: { guildId } },
    });
    return count > 0;
  }

  async hasActiveScrim(teamId: string): Promise<boolean> {
    const count = await prisma.scrim.count({
      where: { teamId, status: { in: ["OPEN", "MATCHED"] } },
    });
    return count > 0;
  }

  async transferLeaderTx(
    teamId: string,
    currentLeaderDiscordId: string,
    newLeaderDiscordId: string,
    guildId: string,
  ): Promise<void> {
    const currentId = await this.resolveUserId(currentLeaderDiscordId, guildId);
    const newId = await this.resolveUserId(newLeaderDiscordId, guildId);
    if (!currentId || !newId) throw new Error("유저를 찾을 수 없습니다");
    await prisma.$transaction([
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: currentId } },
        data: { role: "MEMBER" },
      }),
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: newId } },
        data: { role: "LEADER" },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: { leaderId: newLeaderDiscordId },
      }),
    ]);
  }

  async acceptApplicationTx(
    teamId: string,
    applicantDiscordId: string,
    guildId: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(applicantDiscordId, guildId);
    if (!userId) throw new Error("유저를 찾을 수 없습니다");
    await prisma.$transaction([
      prisma.teamApplication.update({
        where: { teamId_userId: { teamId, userId } },
        data: { status: "ACCEPTED" },
      }),
      prisma.teamMember.create({
        data: { teamId, userId, role: "MEMBER" },
      }),
    ]);
  }

  async leaveTeamByDiscordId(
    discordId: string,
    guildId: string,
  ): Promise<void> {
    const member = await prisma.teamMember.findFirst({
      where: { user: { discordId, guildId }, team: { guildId } },
      select: { teamId: true, userId: true },
    });
    if (!member) throw new Error("소속 팀을 찾을 수 없습니다");
    await prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId: member.teamId, userId: member.userId },
      },
    });
    const count = await prisma.teamMember.count({
      where: { teamId: member.teamId },
    });
    if (count === 0) {
      await prisma.team.delete({ where: { id: member.teamId } });
    }
  }

  async createApplication(
    teamId: string,
    discordId: string,
    guildId: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(discordId, guildId);
    if (!userId) throw new Error("유저를 찾을 수 없습니다");
    await prisma.teamApplication.create({
      data: { teamId, userId, guildId },
    });
  }

  async findApplications(teamId: string): Promise<TeamApplicationData[]> {
    const apps = await prisma.teamApplication.findMany({
      where: { teamId, status: "PENDING" },
      include: { user: { select: { discordId: true, username: true } } },
    });
    return apps.map((a) => ({
      id: a.id,
      teamId: a.teamId,
      userId: a.user.discordId,
      username: a.user.username,
      guildId: a.guildId,
      status: a.status,
      createdAt: a.createdAt,
    }));
  }

  async findApplication(
    teamId: string,
    discordId: string,
  ): Promise<TeamApplicationData | null> {
    const a = await prisma.teamApplication.findFirst({
      where: { teamId, user: { discordId } },
      include: { user: { select: { discordId: true, username: true } } },
    });
    if (!a) return null;
    return {
      id: a.id,
      teamId: a.teamId,
      userId: a.user.discordId,
      username: a.user.username,
      guildId: a.guildId,
      status: a.status,
      createdAt: a.createdAt,
    };
  }

  async updateApplicationStatus(
    teamId: string,
    discordId: string,
    status: ApplicationStatus,
  ): Promise<void> {
    const guildTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { guildId: true },
    });
    if (!guildTeam) throw new Error("팀을 찾을 수 없습니다");
    const userId = await this.resolveUserId(discordId, guildTeam.guildId);
    if (!userId) throw new Error("유저를 찾을 수 없습니다");
    await prisma.teamApplication.update({
      where: { teamId_userId: { teamId, userId } },
      data: { status },
    });
  }

  async existsApplication(teamId: string, discordId: string): Promise<boolean> {
    const count = await prisma.teamApplication.count({
      where: { teamId, user: { discordId } },
    });
    return count > 0;
  }

  private toEntity(data: PrismaTeam): Team {
    return new Team(
      data.id,
      data.name,
      data.leaderId,
      data.guildId,
      data.description,
      data.noShowCount,
    );
  }

  private toPrisma(team: Team) {
    return {
      id: team.id,
      name: team.name,
      leaderId: team.leaderId,
      guildId: team.guildId,
      description: team.description,
      noShowCount: team.noShowCount,
    };
  }
}
