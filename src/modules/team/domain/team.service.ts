import { Team } from './team.entity.js';
import { TeamRepositoryPort, TeamApplicationData } from '../ports/team.repository.port.js';
import { DuplicateError, NotFoundError, PermissionError, ValidationError } from '@/shared/errors/index.js';
import { guardIsRegistered } from '@/shared/guards/index.js';

export class TeamService {
  constructor(private readonly repo: TeamRepositoryPort) {}

  private async getTeamAsLeader(leaderId: string, guildId: string): Promise<Team> {
    const team = await this.repo.findByLeaderId(leaderId, guildId);
    if (!team) throw new NotFoundError('팀');
    if (!team.isLeader(leaderId)) throw new PermissionError('팀 리더만 가능합니다');
    return team;
  }

  async create(
    leaderId: string,
    guildId: string,
    name: string,
    description: string | null
  ): Promise<Team> {
    await guardIsRegistered(leaderId, guildId);

    if (await this.repo.existsByLeaderId(leaderId, guildId)) {
      throw new DuplicateError('이미 팀을 보유하고 있습니다');
    }
    if (await this.repo.existsByName(name, guildId)) {
      throw new DuplicateError('이미 존재하는 팀 이름입니다');
    }

    const team = new Team(
      crypto.randomUUID(),
      name,
      leaderId,
      guildId,
      description,
    );

    await this.repo.save(team);
    return team;
  }

  async findById(id: string): Promise<Team> {
    const team = await this.repo.findById(id);
    if (!team) throw new NotFoundError('팀');
    return team;
  }

  async findByLeaderId(leaderId: string, guildId: string): Promise<Team> {
    const team = await this.repo.findByLeaderId(leaderId, guildId);
    if (!team) throw new NotFoundError('팀');
    return team;
  }

  async findAllByGuildId(guildId: string): Promise<Team[]> {
    return this.repo.findAllByGuildId(guildId);
  }

  async disband(leaderId: string, guildId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    await this.repo.delete(team.id);
  }

  async applyJoin(userId: string, guildId: string, teamName: string): Promise<void> {
    await guardIsRegistered(userId, guildId);

    const team = await this.repo.findByName(teamName, guildId);
    if (!team) throw new NotFoundError('팀');

    if (await this.repo.existsByLeaderId(userId, guildId)) {
      throw new ValidationError('이미 팀을 보유하고 있습니다');
    }
    if (await this.repo.isMember(team.id, userId)) {
      throw new DuplicateError('이미 팀원입니다');
    }
    if (await this.repo.existsApplication(team.id, userId)) {
      throw new DuplicateError('이미 신청했습니다');
    }

    await this.repo.createApplication(team.id, userId, guildId);
  }

  async getPendingApplications(leaderId: string, guildId: string): Promise<TeamApplicationData[]> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    return this.repo.findApplications(team.id);
  }

  async acceptApplication(leaderId: string, guildId: string, applicantId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);

    const application = await this.repo.findApplication(team.id, applicantId);
    if (!application) throw new NotFoundError('신청');

    await this.repo.updateApplicationStatus(team.id, applicantId, 'ACCEPTED');
    await this.repo.addMember(team.id, applicantId);
  }

  async rejectApplication(leaderId: string, guildId: string, applicantId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);

    const application = await this.repo.findApplication(team.id, applicantId);
    if (!application) throw new NotFoundError('신청');

    await this.repo.updateApplicationStatus(team.id, applicantId, 'REJECTED');
  }

  async kickMember(leaderId: string, guildId: string, targetUserId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);

    if (team.leaderId === targetUserId) throw new ValidationError('리더는 추방할 수 없습니다');

    const isMember = await this.repo.isMember(team.id, targetUserId);
    if (!isMember) throw new NotFoundError('팀원');

    await this.repo.removeMember(team.id, targetUserId);
  }
}