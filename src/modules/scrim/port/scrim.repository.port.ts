import { Scrim } from '../domain/scrim.entity.js';
import { ApplicationStatus } from '@/generated/prisma/index.js';

export interface ScrimApplicationData {
  id: string;
  scrimId: string;
  teamId: string;
  teamName: string;
  avgTier: number | null;
  avgTierName: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
}

export interface TeamData {
  id: string;
  noShowCount: number;
  memberCount: number;
  avgTier: number | null;
}

export interface ScrimRepositoryPort {
  findById(id: string): Promise<Scrim | null>;
  findByNumber(number: number, guildId: string): Promise<Scrim | null>;
  findAllOpen(guildId: string): Promise<Scrim[]>;
  findByTeamId(teamId: string): Promise<Scrim[]>;
  findExpiredOpen(): Promise<Scrim[]>;
  getNextNumber(guildId: string): Promise<number>;
  existsOpenScrimByTeam(teamId: string): Promise<boolean>;
  existsActiveMatch(teamId: string): Promise<boolean>;
  findTeamByLeader(discordId: string, guildId: string): Promise<TeamData | null>;
  acceptApplicationTx(scrimId: string, applicantTeamId: string, homeTeamId: string, scheduledAt: Date): Promise<void>;
  cancelScrimTx(scrimId: string): Promise<void>;
  save(scrim: Scrim): Promise<void>;
  update(id: string, scrim: Scrim): Promise<void>;
  delete(id: string): Promise<void>;
  createApplication(scrimId: string, teamId: string, message: string | null): Promise<void>;
  findApplications(scrimId: string): Promise<ScrimApplicationData[]>;
  findApplication(scrimId: string, teamId: string): Promise<ScrimApplicationData | null>;
  findApplicationsByTeam(teamId: string): Promise<ScrimApplicationData[]>;
  updateApplicationStatus(scrimId: string, teamId: string, status: ApplicationStatus): Promise<void>;
  cancelOtherApplications(teamId: string, acceptedScrimId: string): Promise<void>;
  existsApplication(scrimId: string, teamId: string): Promise<boolean>;
}