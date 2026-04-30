import { PrismaUserRepository } from '@/modules/user/adapters/prisma.user.repository.js'
import { UserService } from '@/modules/user/domain/user.service.js'
import { UserCommand } from '@/modules/user/adapters/user.command.js'
import { UserModal } from '@/modules/user/adapters/user.modal.js'

export function buildUserModule() {

  const repository = new PrismaUserRepository();  
  const service = new UserService(repository);    
  const command = new UserCommand(service);       
  const modal = new UserModal(service);            

  return { command, modal }
}