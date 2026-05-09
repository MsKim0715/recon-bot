import { PrismaTeamRepository } from '@/modules/team/adapters/prisma.team.repository.js'
import { TeamService } from '@/modules/team/domain/team.service.js'
import { TeamCommand } from '@/modules/team/adapters/team.command.js'
import { TeamModal } from '@/modules/team/adapters/team.modal.js'
import { TeamButton } from '@/modules/team/adapters/team.button.js';

export function buildTeamModule() {
  const repository = new PrismaTeamRepository();
  const service = new TeamService(repository);
  const modal = new TeamModal(service);
  const command = new TeamCommand(service);
  const button = new TeamButton(service);

  return { command, modal , button}
}