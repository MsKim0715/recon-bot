import { prisma } from '@/infra/database.js';
import { User } from '../domain/user.entity.js';
import { UserRepositoryPort } from '../ports/user.repository.port.js'; 
import { User as PrismaUser, RiotAccount as PrismaRiotAccount } from '@/generated/prisma/index.js';

export class PrismaUserRepository implements UserRepositoryPort {

  async findByDiscordId(discordId: string, guildId: string): Promise<User | null> {
    const data = await prisma.user.findUnique({
      where: { discordId_guildId: { discordId, guildId } },
    
      include: { riotAccount: true }
    });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({
      where: { id },
     
    
      include: { riotAccount: true }
    });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findByPuuid(puuid: string): Promise<User | null> {
    const riotAccount = await prisma.riotAccount.findUnique({
      where: { puuid },
      include: { user: true }
    });
    if (!riotAccount) return null;
    return this.toEntity({ ...riotAccount.user, riotAccount });
  }

  async save(user: User): Promise<void> {
    await prisma.user.create({
      data: {
        id: user.id,
        discordId: user.discordId,
        guildId: user.guildId,
        username: user.username,
      }
    });
  }

  async update(discordId: string, guildId: string, user: User): Promise<void> {
    await prisma.user.update({
      where: { discordId_guildId: { discordId, guildId } },
      data: { username: user.username }
    });
  }

  async delete(discordId: string, guildId: string): Promise<void> {
    await prisma.user.delete({
      where: { discordId_guildId: { discordId, guildId } }
    });
  }


  private toEntity(
    data: PrismaUser & { riotAccount: PrismaRiotAccount | null }
  ): User {
    return new User(
      data.id,
      data.discordId,
      data.guildId,
      data.username,
      data.riotAccount !== null,
      data.riotAccount?.lastSyncedAt ?? null,
      data.riotAccount?.tierName ?? null,
    );
  }
}