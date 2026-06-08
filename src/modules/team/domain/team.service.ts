import { Team } from './team.entity.js';
import { TeamRepositoryPort, TeamApplicationData, TeamDetailData, TeamMemberData } from '../ports/team.repository.port.js';
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

  async create(leaderId: string, guildId: string, name: string, description: string | null): Promise<Team> {
    await guardIsRegistered(leaderId, guildId);
    if (await this.repo.existsByLeaderId(leaderId, guildId)) {
      throw new DuplicateError('이미 팀을 보유하고 있습니다');
    }
    if (await this.repo.existsByName(name, guildId)) {
      throw new DuplicateError('이미 존재하는 팀 이름입니다');
    }
    if (await this.repo.isMemberOfAnyTeam(leaderId, guildId)) {
      throw new ValidationError('이미 다른 팀에 소속되어 있습니다');
    }
    const team = new Team(crypto.randomUUID(), name, leaderId, guildId, description);
    await this.repo.save(team);
    return team;
  }

  async findById(id: string): Promise<Team> {
    const team = await this.repo.findById(id);
    if (!team) throw new NotFoundError('팀');
    return team;
  }

  async findAllByGuildId(guildId: string): Promise<Team[]> {
    return this.repo.findAllByGuildId(guildId);
  }

  async findDetailByLeaderId(leaderId: string, guildId: string): Promise<TeamDetailData> {
    const detail = await this.repo.findDetailByLeaderId(leaderId, guildId);
    if (!detail) throw new NotFoundError('팀');
    return detail;
  }

  async getMembers(leaderId: string, guildId: string): Promise<TeamMemberData[]> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    return this.repo.findMembers(team.id);
  }

  async disband(leaderId: string, guildId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    if (await this.repo.hasActiveScrim(team.id)) {
      throw new ValidationError('진행 중인 스크림이 있어 해체할 수 없습니다');
    }
    await this.repo.delete(team.id);
  }

  async updateTeam(leaderId: string, guildId: string, name: string, description: string | null): Promise<Team> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    if (name !== team.name && await this.repo.existsByName(name, guildId)) {
      throw new DuplicateError('이미 존재하는 팀 이름입니다');
    }
    const updated = team.updateInfo(name, description);
    await this.repo.update(team.id, updated);
    return updated;
  }

  async transferLeader(leaderId: string, guildId: string, targetUserId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    if (leaderId === targetUserId) {
      throw new ValidationError('자기 자신에게 양도할 수 없습니다');
    }
    const isMember = await this.repo.isMember(team.id, targetUserId);
    if (!isMember) throw new NotFoundError('팀원');
    await this.repo.transferLeaderTx(team.id, leaderId, targetUserId, guildId);
  }

  async leaveTeam(userId: string, guildId: string): Promise<void> {
    await guardIsRegistered(userId, guildId);
    const isLeader = await this.repo.existsByLeaderId(userId, guildId);
    if (isLeader) throw new ValidationError('리더는 양도 후 탈퇴 가능합니다');
    await this.repo.leaveTeamByDiscordId(userId, guildId);
  }

  async applyJoin(userId: string, guildId: string, teamName: string): Promise<void> {
    await guardIsRegistered(userId, guildId);
    const team = await this.repo.findByName(teamName, guildId);
    if (!team) throw new NotFoundError('팀');
    if (team.leaderId === userId) {
      throw new ValidationError('자신의 팀에 신청할 수 없습니다');
    }
    if (await this.repo.isMemberOfAnyTeam(userId, guildId)) {
      throw new ValidationError('이미 다른 팀에 소속되어 있습니다');
    }
    if (await this.repo.isMember(team.id, userId)) {
      throw new DuplicateError('이미 팀원입니다');
    }
    if (await this.repo.existsApplication(team.id, userId)) {
      throw new DuplicateError('이미 신청했습니다');
    }
    await this.repo.createApplication(team.id, userId, guildId);
  }

  async cancelApplication(userId: string, guildId: string, teamName: string): Promise<void> {
    await guardIsRegistered(userId, guildId);
    const team = await this.repo.findByName(teamName, guildId);
    if (!team) throw new NotFoundError('팀');
    const application = await this.repo.findApplication(team.id, userId);
    if (!application) throw new NotFoundError('신청');
    if (application.status !== 'PENDING') {
      throw new ValidationError('이미 처리된 신청입니다');
    }
    await this.repo.updateApplicationStatus(team.id, userId, 'CANCELLED');
  }

  async getPendingApplications(leaderId: string, guildId: string): Promise<TeamApplicationData[]> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    return this.repo.findApplications(team.id);
  }

  async acceptApplication(leaderId: string, guildId: string, applicantId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    const application = await this.repo.findApplication(team.id, applicantId);
    if (!application) throw new NotFoundError('신청');
    await this.repo.acceptApplicationTx(team.id, applicantId, guildId);
  }

  async rejectApplication(leaderId: string, guildId: string, applicantId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    const application = await this.repo.findApplication(team.id, applicantId);
    if (!application) throw new NotFoundError('신청');
    await this.repo.updateApplicationStatus(team.id, applicantId, 'REJECTED');
  }

  async kickMember(leaderId: string, guildId: string, targetUserId: string): Promise<void> {
    const team = await this.getTeamAsLeader(leaderId, guildId);
    if (leaderId === targetUserId) {
      throw new ValidationError('자기 자신을 추방할 수 없습니다');
    }
    const isMember = await this.repo.isMember(team.id, targetUserId);
    if (!isMember) throw new NotFoundError('팀원');
    await this.repo.removeMember(team.id, targetUserId, guildId);
    const count = await this.repo.countMembers(team.id);
    if (count === 0) {
      await this.repo.delete(team.id);
    }
  }
}