import { prisma } from '@/infra/database.js';
import { Match, type MatchStatus } from '../domain/match.entity.js';
import type {
  MatchRepositoryPort,
  TeamRef,
  MatchResultData,
  MatchView,
  SubmitResultData,
} from '../port/match.repository.port.js';

export class PrismaMatchRepository implements MatchRepositoryPort {
  async findById(id: string): Promise<Match | null> {
    const data = await prisma.match.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findViewById(id: string): Promise<MatchView | null> {
    const data = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        scrim: true,
        result: { include: { sets: { orderBy: { setNumber: 'asc' } } } },
      },
    });
    if (!data) return null;
    return this.toView(data);
  }

  async findResult(matchId: string): Promise<MatchResultData | null> {
    const data = await prisma.matchResult.findUnique({
      where: { matchId },
      include: { sets: { orderBy: { setNumber: 'asc' } } },
    });
    if (!data) return null;
    return this.toResult(data);
  }

  async findTeamByLeader(discordId: string, guildId: string): Promise<TeamRef | null> {
    const team = await prisma.team.findFirst({
      where: { leaderId: discordId, guildId },
      select: { id: true, name: true },
    });
    if (!team) return null;
    return { id: team.id, name: team.name };
  }

  async findMatchesByTeam(teamId: string): Promise<MatchView[]> {
    const data = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        scrim: true,
        result: { include: { sets: { orderBy: { setNumber: 'asc' } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    return data.map(this.toView.bind(this));
  }

  async submitResultTx(matchId: string, data: SubmitResultData): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const result = await tx.matchResult.create({
        data: {
          id: crypto.randomUUID(),
          matchId,
          winnerId: data.winnerId,
          loserId: data.loserId,
          homeSetsWon: data.homeSetsWon,
          awaySetsWon: data.awaySetsWon,
          submittedBy: data.submittedBy,
        },
      });

      if (data.sets.length > 0) {
        await tx.matchSet.createMany({
          data: data.sets.map((s) => ({
            id: crypto.randomUUID(),
            resultId: result.id,
            setNumber: s.setNumber,
            homeScore: s.homeScore,
            awayScore: s.awayScore,
          })),
        });
      }

      await tx.match.update({
        where: { id: matchId },
        data: { status: 'ONGOING' },
      });
    });
  }

  async markCompleted(matchId: string): Promise<void> {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'COMPLETED' },
    });
  }

  async rejectResultTx(matchId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // MatchSet 은 onDelete: Cascade 로 함께 삭제됨
      await tx.matchResult.delete({ where: { matchId } });

      await tx.match.update({
        where: { id: matchId },
        data: { status: 'SCHEDULED' },
      });
    });
  }

  async noShowTx(matchId: string, penalizedTeamId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'NO_SHOW' },
      });

      await tx.team.update({
        where: { id: penalizedTeamId },
        data: { noShowCount: { increment: 1 } },
      });
    });
  }

  private toEntity(data: any): Match {
    return new Match(
      data.id,
      data.scrimId,
      data.homeTeamId,
      data.awayTeamId,
      data.scheduledAt,
      data.status as MatchStatus,
    );
  }

  private toResult(data: any): MatchResultData {
    return {
      matchId: data.matchId,
      winnerId: data.winnerId,
      loserId: data.loserId,
      homeSetsWon: data.homeSetsWon,
      awaySetsWon: data.awaySetsWon,
      submittedBy: data.submittedBy,
      createdAt: data.createdAt,
      sets: (data.sets ?? []).map((s: any) => ({
        setNumber: s.setNumber,
        homeScore: s.homeScore,
        awayScore: s.awayScore,
      })),
    };
  }

  private toView(data: any): MatchView {
    return {
      id: data.id,
      scrimId: data.scrimId,
      scrimNumber: data.scrim?.number ?? 0,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      homeTeamName: data.homeTeam?.name ?? '알 수 없음',
      awayTeamName: data.awayTeam?.name ?? '알 수 없음',
      scheduledAt: data.scheduledAt,
      status: data.status,
      result: data.result ? this.toResult(data.result) : null,
    };
  }

  async findTeamOfMember(
    discordId: string,
    guildId: string,
  ): Promise<{ id: string; isLeader: boolean } | null> {
    const m = await prisma.teamMember.findFirst({
      where: { user: { discordId, guildId }, team: { guildId } },
      select: { role: true, teamId: true },
    });
    if (!m) return null;
    return { id: m.teamId, isLeader: m.role === 'LEADER' };
  }
 
}