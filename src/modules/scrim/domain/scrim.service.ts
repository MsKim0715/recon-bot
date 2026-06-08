import { Scrim } from './scrim.entity.js';
import { ScrimRepositoryPort, ScrimApplicationData } from '../port/scrim.repository.port.js';
import { NotFoundError, ValidationError, DuplicateError, PermissionError } from '@/shared/errors/index.js';
import { guardIsRegistered } from '@/shared/guards/index.js';
import { logger } from '@/infra/logger.js';

const CANCEL_DEADLINE_HOURS = 3;

export class ScrimService {
  constructor(private readonly repo: ScrimRepositoryPort) {}

  async createScrim(
    discordId: string,
    guildId: string,
    scheduledAt: Date,
    description: string | null,
    minTier: number | null,
    maxTier: number | null,
  ): Promise<Scrim> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    if (team.noShowCount >= 3) {
      throw new ValidationError('노쇼 패널티로 스크림을 생성할 수 없습니다');
    }

    if (scheduledAt <= new Date()) {
      throw new ValidationError('경기 일정은 현재 시간 이후여야 합니다');
    }

    if (await this.repo.existsOpenScrimByTeam(team.id)) {
      throw new ValidationError('이미 모집 중인 스크림이 있습니다');
    }

    const number = await this.repo.getNextNumber(guildId);

    const scrim = new Scrim(
      crypto.randomUUID(),
      number,
      team.id,
      guildId,
      scheduledAt,
      description,
      minTier,
      maxTier,
    );

    await this.repo.save(scrim);
    return scrim;
  }

  async getOpenScrims(guildId: string): Promise<Scrim[]> {
    return this.repo.findAllOpen(guildId);
  }

  async getMyScrimsByLeader(discordId: string, guildId: string): Promise<Scrim[]> {
    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) return [];
    return this.repo.findByTeamId(team.id);
  }

  async getMyApplicationScrims(discordId: string, guildId: string): Promise<Scrim[]> {
    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) return [];

    const applications = await this.repo.findApplicationsByTeam(team.id);
    const scrimIds = applications
      .filter(a => a.status === 'PENDING')
      .map(a => a.scrimId);

    const scrims = await Promise.all(
      scrimIds.map(id => this.repo.findById(id))
    );

    return scrims.filter((s): s is Scrim => s !== null);
  }

  async getScrimByNumber(scrimNumber: number, guildId: string): Promise<Scrim> {
    const scrim = await this.repo.findByNumber(scrimNumber, guildId);
    if (!scrim) throw new NotFoundError('스크림');
    return scrim;
  }

  async applyScrim(
    discordId: string,
    guildId: string,
    scrimNumber: number,
    message: string | null,
  ): Promise<void> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    const scrim = await this.repo.findByNumber(scrimNumber, guildId);
    if (!scrim) throw new NotFoundError('스크림');

    if (scrim.teamId === team.id) {
      throw new ValidationError('자신의 스크림에 신청할 수 없습니다');
    }

    if (!scrim.canApply()) {
      throw new ValidationError('신청할 수 없는 스크림입니다');
    }

    if (await this.repo.existsApplication(scrim.id, team.id)) {
      throw new DuplicateError('이미 신청한 스크림입니다');
    }

    if (team.noShowCount >= 3) {
      throw new ValidationError('노쇼 패널티로 스크림을 신청할 수 없습니다');
    }

    if (team.memberCount === 0) {
      throw new ValidationError('팀원이 없어 스크림을 신청할 수 없습니다');
    }

    if (await this.repo.existsActiveMatch(team.id)) {
      throw new ValidationError('이미 매칭된 스크림이 있습니다');
    }

    if (scrim.hasTierLimit()) {
      if (team.avgTier === null) {
        throw new ValidationError('팀원 전적 정보가 없습니다');
      }

      if (!scrim.isInTierRange(team.avgTier)) {
        throw new ValidationError(
          `티어 제한 범위를 벗어났습니다 (${scrim.minTier} ~ ${scrim.maxTier})`
        );
      }
    }

    await this.repo.createApplication(scrim.id, team.id, message);
  }

  async getApplications(
    discordId: string,
    guildId: string,
    scrimNumber: number
  ): Promise<ScrimApplicationData[]> {
    const scrim = await this.repo.findByNumber(scrimNumber, guildId);
    if (!scrim) throw new NotFoundError('스크림');

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team || team.id !== scrim.teamId) {
      throw new PermissionError('스크림 모집 팀 리더만 가능합니다');
    }

    return this.repo.findApplications(scrim.id);
  }

  async acceptApplication(
    discordId: string,
    guildId: string,
    scrimId: string,
    applicantTeamId: string,
  ): Promise<void> {
    const scrim = await this.repo.findById(scrimId);
    if (!scrim) throw new NotFoundError('스크림');

    if (scrim.status === 'MATCHED') {
      throw new ValidationError('이미 매칭된 스크림입니다');
    }

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team || team.id !== scrim.teamId) {
      throw new PermissionError('스크림 모집 팀 리더만 가능합니다');
    }

    const application = await this.repo.findApplication(scrimId, applicantTeamId);
    if (!application) throw new NotFoundError('신청');

    await this.repo.acceptApplicationTx(
      scrimId,
      applicantTeamId,
      scrim.teamId,
      scrim.scheduledAt,
    );
  }

  async rejectApplication(
    discordId: string,
    guildId: string,
    scrimId: string,
    applicantTeamId: string,
  ): Promise<void> {
    const scrim = await this.repo.findById(scrimId);
    if (!scrim) throw new NotFoundError('스크림');

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team || team.id !== scrim.teamId) {
      throw new PermissionError('스크림 모집 팀 리더만 가능합니다');
    }

    await this.repo.updateApplicationStatus(scrimId, applicantTeamId, 'REJECTED');
  }

  async cancelApplication(
    discordId: string,
    guildId: string,
    scrimNumber: number,
  ): Promise<void> {
    await guardIsRegistered(discordId, guildId);

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team) throw new NotFoundError('팀');

    const scrim = await this.repo.findByNumber(scrimNumber, guildId);
    if (!scrim) throw new NotFoundError('스크림');

    const application = await this.repo.findApplication(scrim.id, team.id);
    if (!application) throw new NotFoundError('신청');

    if (application.status !== 'PENDING') {
      throw new ValidationError('이미 처리된 신청입니다');
    }

    const diff = Date.now() - application.createdAt.getTime();
    if (diff > 1000 * 60 * 60 * CANCEL_DEADLINE_HOURS) {
      throw new ValidationError('신청 후 3시간이 지나 취소할 수 없습니다');
    }

    await this.repo.updateApplicationStatus(scrim.id, team.id, 'CANCELLED');
  }

  async closeScrim(discordId: string, guildId: string, scrimNumber: number): Promise<void> {
    const scrim = await this.repo.findByNumber(scrimNumber, guildId);
    if (!scrim) throw new NotFoundError('스크림');

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team || team.id !== scrim.teamId) {
      throw new PermissionError('스크림 모집 팀 리더만 가능합니다');
    }

    if (scrim.status !== 'OPEN') {
      throw new ValidationError('OPEN 상태의 스크림만 마감할 수 있습니다');
    }

    await this.repo.update(scrim.id, scrim.close());
  }

  async cancelScrim(discordId: string, guildId: string, scrimNumber: number): Promise<void> {
    const scrim = await this.repo.findByNumber(scrimNumber, guildId);
    if (!scrim) throw new NotFoundError('스크림');

    const team = await this.repo.findTeamByLeader(discordId, guildId);
    if (!team || team.id !== scrim.teamId) {
      throw new PermissionError('스크림 모집 팀 리더만 가능합니다');
    }

    if (scrim.status === 'MATCHED') {
      throw new ValidationError('이미 매칭된 스크림은 취소할 수 없습니다');
    }

    await this.repo.cancelScrimTx(scrim.id);
  }

  async expireOpenScrims(): Promise<void> {
    const expired = await this.repo.findExpiredOpen();

    logger.info({ count: expired.length }, '만료된 스크림 수');

    for (const scrim of expired) {
      const applications = await this.repo.findApplications(scrim.id);
      if (applications.length === 0) {
        await this.repo.update(scrim.id, scrim.cancel());
        logger.info({ scrimId: scrim.id, number: scrim.number }, '스크림 자동 파기');
      }
    }
  }
}