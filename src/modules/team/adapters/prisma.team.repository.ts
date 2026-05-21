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
  async findMembers(teamId: string): Promise<TeamMemberData[]> {
    const data = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });

    return data.map((m) => ({
      userId: m.user.discordId,
      username: m.user.username,
      tierName: null,
      currentTier: null,
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
    const data = await prisma.team.findFirst({
      where: { leaderId, guildId },
    });
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
        members: {
          include: {
            user: {
              include: { riotAccount: true },
            },
          },
        },
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
      userId: m.userId,
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
    const user = await prisma.user.findUnique({
      where: {
        discordId_guildId: {
          discordId: team.leaderId,
          guildId: team.guildId,
        },
      },
    });
    if (!user) throw new Error("유저를 찾을 수 없습니다");

    await prisma.$transaction([
      prisma.team.create({ data: this.toPrisma(team) }),
      prisma.teamMember.create({
        data: { teamId: team.id, userId: user.id, role: "LEADER" },
      }),
    ]);
  }

  async update(id: string, team: Team): Promise<void> {
    await prisma.team.update({
      where: { id },
      data: this.toPrisma(team),
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.team.delete({ where: { id } });
  }

  async addMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.create({
      data: { teamId, userId, role: "MEMBER" },
    });
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const count = await prisma.teamMember.count({
      where: { teamId, userId },
    });
    return count > 0;
  }

  async countMembers(teamId: string): Promise<number> {
    return prisma.teamMember.count({ where: { teamId } });
  }

  async isMemberOfAnyTeam(userId: string, guildId: string): Promise<boolean> {
    const count = await prisma.teamMember.count({
      where: {
        userId,
        team: { guildId },
      },
    });
    return count > 0;
  }

  async hasActiveScrim(teamId: string): Promise<boolean> {
    const count = await prisma.scrim.count({
      where: {
        teamId,
        status: { in: ["OPEN", "MATCHED"] },
      },
    });
    return count > 0;
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: "LEADER" | "MEMBER",
  ): Promise<void> {
    await prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { role },
    });
  }

  async createApplication(
    teamId: string,
    userId: string,
    guildId: string,
  ): Promise<void> {
    await prisma.teamApplication.create({
      data: { teamId, userId, guildId },
    });
  }

  async findApplications(teamId: string): Promise<TeamApplicationData[]> {
    return prisma.teamApplication.findMany({
      where: { teamId, status: "PENDING" },
    });
  }

  async findApplication(
    teamId: string,
    userId: string,
  ): Promise<TeamApplicationData | null> {
    return prisma.teamApplication.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async updateApplicationStatus(
    teamId: string,
    userId: string,
    status: ApplicationStatus,
  ): Promise<void> {
    await prisma.teamApplication.update({
      where: { teamId_userId: { teamId, userId } },
      data: { status },
    });
  }

  async existsApplication(teamId: string, userId: string): Promise<boolean> {
    const count = await prisma.teamApplication.count({
      where: { teamId, userId },
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
