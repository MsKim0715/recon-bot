import { prisma } from '@/infra/database.js';
import { Scrim, ScrimStatus } from '../domain/scrim.entity.js';
import { ScrimRepositoryPort, ScrimApplicationData, TeamData } from '../port/scrim.repository.port.js';
import { ApplicationStatus } from '@/generated/prisma/index.js';

export class PrismaScrimRepository implements ScrimRepositoryPort {

  async findById(id: string): Promise<Scrim | null> {
    const data = await prisma.scrim.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findByNumber(number: number, guildId: string): Promise<Scrim | null> {
    const data = await prisma.scrim.findUnique({
      where: { number_guildId: { number, guildId } }
    });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAllOpen(guildId: string): Promise<Scrim[]> {
    const data = await prisma.scrim.findMany({
      where: { status: 'OPEN', guildId },
      orderBy: { scheduledAt: 'asc' }
    });
    return data.map(this.toEntity.bind(this));
  }

  async findByTeamId(teamId: string): Promise<Scrim[]> {
    const data = await prisma.scrim.findMany({
      where: { teamId, status: 'OPEN' },
      orderBy: { scheduledAt: 'asc' }
    });
    return data.map(this.toEntity.bind(this));
  }

  async findExpiredOpen(): Promise<Scrim[]> {
    const data = await prisma.scrim.findMany({
      where: {
        status: 'OPEN',
        scheduledAt: { lt: new Date() }
      }
    });
    return data.map(this.toEntity.bind(this));
  }

  async getNextNumber(guildId: string): Promise<number> {
    const last = await prisma.scrim.findFirst({
      where: { guildId },
      orderBy: { number: 'desc' }
    });
    return (last?.number ?? 0) + 1;
  }

  async existsOpenScrimByTeam(teamId: string): Promise<boolean> {
    const count = await prisma.scrim.count({
      where: { teamId, status: 'OPEN' }
    });
    return count > 0;
  }

  async existsActiveMatch(teamId: string): Promise<boolean> {
    const count = await prisma.match.count({
      where: {
        status: { in: ['SCHEDULED', 'ONGOING'] },
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId }
        ]
      }
    });
    return count > 0;
  }

  async findTeamByLeader(discordId: string, guildId: string): Promise<TeamData | null> {
    const team = await prisma.team.findFirst({
      where: { leaderId: discordId, guildId },
      include: {
        members: {
          include: {
            user: {
              include: { riotAccount: true }
            }
          }
        }
      }
    });

    if (!team) return null;

    const tiers = team.members
      .map(m => m.user.riotAccount?.currentTier)
      .filter((t): t is number => t !== null && t !== undefined);

    const avgTier = tiers.length > 0
      ? tiers.reduce((sum, t) => sum + t, 0) / tiers.length
      : null;

    return {
      id: team.id,
      noShowCount: team.noShowCount,
      memberCount: team.members.length,
      avgTier,
    };
  }

  async acceptApplicationTx(
    scrimId: string,
    applicantTeamId: string,
    homeTeamId: string,
    scheduledAt: Date
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.scrimApplication.update({
        where: { scrimId_teamId: { scrimId, teamId: applicantTeamId } },
        data: { status: 'ACCEPTED' }
      });

      await tx.scrim.update({
        where: { id: scrimId },
        data: { status: 'MATCHED' }
      });

      await tx.match.create({
        data: {
          id: crypto.randomUUID(),
          scrimId,
          homeTeamId,
          awayTeamId: applicantTeamId,
          scheduledAt,
          status: 'SCHEDULED',
        }
      });

      await tx.scrimApplication.updateMany({
        where: {
          scrimId,
          teamId: { not: applicantTeamId },
          status: 'PENDING'
        },
        data: { status: 'CANCELLED' }
      });

      await tx.scrimApplication.updateMany({
        where: {
          teamId: applicantTeamId,
          scrimId: { not: scrimId },
          status: 'PENDING'
        },
        data: { status: 'CANCELLED' }
      });
    });
  }

  async cancelScrimTx(scrimId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.scrim.update({
        where: { id: scrimId },
        data: { status: 'CANCELLED' }
      });

      await tx.scrimApplication.updateMany({
        where: {
          scrimId,
          status: 'PENDING'
        },
        data: { status: 'CANCELLED' }
      });
    });
  }

  async save(scrim: Scrim): Promise<void> {
    await prisma.scrim.create({
      data: {
        id: scrim.id,
        number: scrim.number,
        teamId: scrim.teamId,
        guildId: scrim.guildId,
        scheduledAt: scrim.scheduledAt,
        description: scrim.description,
        minTier: scrim.minTier,
        maxTier: scrim.maxTier,
        status: scrim.status,
      }
    });
  }

  async update(id: string, scrim: Scrim): Promise<void> {
    await prisma.scrim.update({
      where: { id },
      data: {
        scheduledAt: scrim.scheduledAt,
        description: scrim.description,
        minTier: scrim.minTier,
        maxTier: scrim.maxTier,
        status: scrim.status,
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.scrim.delete({ where: { id } });
  }

  async createApplication(scrimId: string, teamId: string, message: string | null): Promise<void> {
    await prisma.scrimApplication.create({
      data: { scrimId, teamId, message }
    });
  }

  async findApplications(scrimId: string): Promise<ScrimApplicationData[]> {
    const data = await prisma.scrimApplication.findMany({
      where: { scrimId, status: 'PENDING' },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { include: { riotAccount: true } }
              }
            }
          }
        }
      }
    });

    return data.map(app => {
      const tiers = app.team.members
        .map(m => m.user.riotAccount?.currentTier)
        .filter((t): t is number => t !== null && t !== undefined);

      const avgTier = tiers.length > 0
        ? tiers.reduce((sum, t) => sum + t, 0) / tiers.length
        : null;

      const avgTierRounded = avgTier !== null ? Math.round(avgTier) : null;
      const avgTierName = avgTierRounded !== null
        ? app.team.members
            .map(m => m.user.riotAccount)
            .find(r => r?.currentTier === avgTierRounded)?.tierName ?? null
        : null;

      return {
        id: app.id,
        scrimId: app.scrimId,
        teamId: app.teamId,
        teamName: app.team.name,
        avgTier,
        avgTierName,
        message: app.message,
        status: app.status,
        createdAt: app.createdAt,
      };
    });
  }

  async findApplication(scrimId: string, teamId: string): Promise<ScrimApplicationData | null> {
    const data = await prisma.scrimApplication.findUnique({
      where: { scrimId_teamId: { scrimId, teamId } },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { include: { riotAccount: true } }
              }
            }
          }
        }
      }
    });

    if (!data) return null;

    const tiers = data.team.members
      .map(m => m.user.riotAccount?.currentTier)
      .filter((t): t is number => t !== null && t !== undefined);

    const avgTier = tiers.length > 0
      ? tiers.reduce((sum, t) => sum + t, 0) / tiers.length
      : null;

    const avgTierRounded = avgTier !== null ? Math.round(avgTier) : null;
    const avgTierName = avgTierRounded !== null
      ? data.team.members
          .map(m => m.user.riotAccount)
          .find(r => r?.currentTier === avgTierRounded)?.tierName ?? null
      : null;

    return {
      id: data.id,
      scrimId: data.scrimId,
      teamId: data.teamId,
      teamName: data.team.name,
      avgTier,
      avgTierName,
      message: data.message,
      status: data.status,
      createdAt: data.createdAt,
    };
  }

  async findApplicationsByTeam(teamId: string): Promise<ScrimApplicationData[]> {
    const data = await prisma.scrimApplication.findMany({
      where: { teamId, status: 'PENDING' },
      include: { team: true }
    });

    return data.map(app => ({
      id: app.id,
      scrimId: app.scrimId,
      teamId: app.teamId,
      teamName: app.team.name,
      avgTier: null,
      avgTierName: null,
      message: app.message,
      status: app.status,
      createdAt: app.createdAt,
    }));
  }

  async updateApplicationStatus(scrimId: string, teamId: string, status: ApplicationStatus): Promise<void> {
    await prisma.scrimApplication.update({
      where: { scrimId_teamId: { scrimId, teamId } },
      data: { status }
    });
  }

  async cancelOtherApplications(teamId: string, acceptedScrimId: string): Promise<void> {
    await prisma.scrimApplication.updateMany({
      where: {
        teamId,
        scrimId: { not: acceptedScrimId },
        status: 'PENDING'
      },
      data: { status: 'CANCELLED' }
    });
  }

  async existsApplication(scrimId: string, teamId: string): Promise<boolean> {
    const count = await prisma.scrimApplication.count({
      where: { scrimId, teamId }
    });
    return count > 0;
  }

  private toEntity(data: any): Scrim {
    return new Scrim(
      data.id,
      data.number,
      data.teamId,
      data.guildId,
      data.scheduledAt,
      data.description,
      data.minTier,
      data.maxTier,
      data.status as ScrimStatus,
    );
  }
}