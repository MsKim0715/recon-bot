import { Team } from '../domain/team.entity.js';
import { ApplicationStatus } from '@/generated/prisma/index.js';

export interface TeamApplicationData {
  id: string;
  teamId: string;
  userId: string;
  guildId: string;
  status: string;
  createdAt: Date;
}

export interface TeamMemberData {
  userId: string;
  username: string;
  tierName: string | null;
  currentTier: number | null;
}

export interface TeamDetailData {
  team: Team;
  members: TeamMemberData[];
  avgTier: number | null;
  avgTierName: string | null;
  winCount: number;
  loseCount: number;
}

export interface TeamRepositoryPort {
  findById(id: string): Promise<Team | null>;
  findByName(name: string, guildId: string): Promise<Team | null>;
  findByLeaderId(leaderId: string, guildId: string): Promise<Team | null>;
  findAllByGuildId(guildId: string): Promise<Team[]>;
  findDetailByLeaderId(leaderId: string, guildId: string): Promise<TeamDetailData | null>;
  findMembers(teamId: string): Promise<TeamMemberData[]>;
  existsByName(name: string, guildId: string): Promise<boolean>;
  existsByLeaderId(leaderId: string, guildId: string): Promise<boolean>;
  save(team: Team): Promise<void>;
  update(id: string, team: Team): Promise<void>;
  delete(id: string): Promise<void>;
  addMember(teamId: string, userId: string): Promise<void>;
  removeMember(teamId: string, userId: string): Promise<void>;
  isMember(teamId: string, userId: string): Promise<boolean>;
  countMembers(teamId: string): Promise<number>;
  isMemberOfAnyTeam(userId: string, guildId: string): Promise<boolean>;
  hasActiveScrim(teamId: string): Promise<boolean>;
  updateMemberRole(teamId: string, userId: string, role: 'LEADER' | 'MEMBER'): Promise<void>;
  createApplication(teamId: string, userId: string, guildId: string): Promise<void>;
  findApplications(teamId: string): Promise<TeamApplicationData[]>;
  findApplication(teamId: string, userId: string): Promise<TeamApplicationData | null>;
  updateApplicationStatus(teamId: string, userId: string, status: ApplicationStatus): Promise<void>;
  existsApplication(teamId: string, userId: string): Promise<boolean>;
}