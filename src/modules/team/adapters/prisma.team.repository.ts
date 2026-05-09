import { prisma } from "@/infra/database.js";
import { Team } from "../domain/team.entity.js";
import {
  TeamApplicationData,
  TeamRepositoryPort,
} from "../ports/team.repository.port.js";
import {
  ApplicationStatus,
  Team as PrismaTeam,
} from "@/generated/prisma/index.js";

export class PrismaTeamRepository implements TeamRepositoryPort {
  async findAllByGuildId(guildId: string): Promise<Team[]> {
    const data = await prisma.team.findMany({
      where: { guildId },
    });
    return data.map(this.toEntity.bind(this));
  }

  async findById(id: string): Promise<Team | null> {
    const data = await prisma.team.findUnique({
      where: { id },
    });
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

  async existsByName(name: string, guildId: string): Promise<boolean> {
    const count = await prisma.team.count({
      where: { name, guildId },
    });
    return count > 0;
  }
  async existsByLeaderId(leaderId: string, guildId: string): Promise<boolean> {
    const count = await prisma.team.count({
      where: { leaderId, guildId },
    });
    return count > 0;
  }

async save(team: Team): Promise<void> {
  // leaderId(Discord ID)로 User.id(cuid) 조회
  const user = await prisma.user.findUnique({
    where: {
      discordId_guildId: {
        discordId: team.leaderId,
        guildId: team.guildId
      }
    }
  });

  if (!user) throw new Error('유저를 찾을 수 없습니다');

  await prisma.$transaction([
    prisma.team.create({ data: this.toPrisma(team) }),
    prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,  
        role: 'LEADER'
      }
    })
  ]);
}
  async update(id: string, team: Team): Promise<void> {
    await prisma.team.update({
      where: { id },
      data: this.toPrisma(team),
    });
  }
  async delete(id: string): Promise<void> {
    await prisma.team.delete({
      where: { id },
    });
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

  async createApplication(
    teamId: string,
    userId: string,
    guildId: string,
  ): Promise<void> {
    await prisma.teamApplication.create({
      data: { teamId, userId, guildId },
    });
  }
  findApplications(teamId: string): Promise<TeamApplicationData[]> {
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
