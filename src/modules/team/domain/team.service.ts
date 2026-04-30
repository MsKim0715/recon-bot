import { Team } from "./team.entity.js";
import { TeamRepositoryPort } from "../ports/team.repository.port.js";
import {
  DuplicateError,
  NotFoundError,
  PermissionError,
} from "@/shared/errors/index.js";

export class TeamService {
  constructor(private readonly repo: TeamRepositoryPort) {}

  async create(
    leaderId: string,
    guildId: string,
    name: string,
    description: string | null,
  ): Promise<Team> {
    const existingLeaderTeam = await this.repo.findByLeaderId(
      leaderId,
      guildId,
    );
    if (existingLeaderTeam)
      throw new DuplicateError("이미 팀을 보유하고 있습니다");

    const existingName = await this.repo.findByName(name, guildId);
    if (existingName) throw new DuplicateError("이미 존재하는 팀 이름입니다");

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
    if (!team) throw new NotFoundError("팀");
    return team;
  }

  async findByLeaderId(leaderId: string, guildId: string): Promise<Team> {
    const team = await this.repo.findByLeaderId(leaderId, guildId);
    if (!team) throw new NotFoundError("팀");
    return team;
  }

  async updateInfo(
    leaderId: string,
    guildId: string,
    name: string,
    description: string | null,
  ): Promise<Team> {
    const team = await this.repo.findByLeaderId(leaderId, guildId);
    if (!team) throw new NotFoundError("팀");
    if (!team.isLeader(leaderId))
      throw new PermissionError("팀 리더만 수정 가능합니다");

    if (team.name !== name) {
      const existingName = await this.repo.findByName(name, guildId);
      if (existingName) throw new DuplicateError("이미 존재하는 팀 이름입니다");
    }

    const updatedTeam = team.updateInfo(name, description);
    await this.repo.update(team.id, updatedTeam);
    return updatedTeam;
  }

  async transferLeader(
    currentLeaderId: string,
    guildId: string,
    newLeaderId: string,
  ): Promise<Team> {
    const team = await this.repo.findByLeaderId(currentLeaderId, guildId);
    if (!team) throw new NotFoundError("팀");
    if (!team.isLeader(currentLeaderId))
      throw new PermissionError("팀 리더만  가능합니다");

    const updatedTeam = team.transferLeader(newLeaderId);
    await this.repo.update(team.id, updatedTeam);
    return updatedTeam;
  }
  async dishand(leaderId: string, guildId: string): Promise<void> {
    const team = await this.repo.findByLeaderId(leaderId, guildId);
    if (!team) throw new NotFoundError("팀");
    if (!team.isLeader(leaderId))
      throw new PermissionError("팀 리더만 가능합니다");

    await this.repo.delete(team.id);
  }
}
