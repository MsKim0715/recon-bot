import { prisma } from "@/infra/database.js";
import { Team } from "../domain/team.entity.js";
import { TeamRepositoryPort } from "../ports/team.repository.port.js";
import { TeamStats } from "../domain/value-objects/team-stats.value-object.js";
import { Team as PrismaTeam } from "@/generated/prisma/index.js";

export class PrismaTeamRepository implements TeamRepositoryPort {
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

  async save(team: Team): Promise<void> {
    await prisma.team.create({
      data: this.toPrisma(team),
    });
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

  private toEntity(data: PrismaTeam): Team {
    const stats = data.avgTier
      ? new TeamStats(
          data.avgTier,
          data.avgTierName!,
          data.avgWinRate!,
          data.avgKda!,
        )
      : null;

    return new Team(
      data.id,
      data.name,
      data.leaderId,
      data.guildId,
      data.description,
      stats,
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
      avgTier: team.stats?.avgTier ?? null,
      avgTierName: team.stats?.avgTierName ?? null,
      avgWinRate: team.stats?.avgWinRate ?? null,
      avgKda: team.stats?.avgKda ?? null,
      noShowCount: team.noShowCount,
    };
  }
}
