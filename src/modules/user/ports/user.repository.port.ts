import { User } from "../domain/user.entity.js";

export interface UserRepositoryPort {
  findByDiscordId(discordId: string, guildId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByPuuid(puuid: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(discordId: string, guildId: string, user: User): Promise<void>;
  delete(discordId: string, guildId: string): Promise<void>;
}