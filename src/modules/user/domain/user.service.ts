import { User } from "./user.entity.js";
import { UserRepositoryPort } from "../ports/user.repository.port.js";
import { DuplicateError, NotFoundError } from "@/shared/errors/index.js";

export class UserService {
  constructor(private readonly repo: UserRepositoryPort) {}

  async register(
    discordId: string,
    guildId: string,
    username: string,
  ): Promise<User> {
    const existing = await this.repo.findByDiscordId(discordId, guildId);
    if (existing) throw new DuplicateError("이미 등록된 회원");

    const user = new User(crypto.randomUUID(), discordId, guildId, username);
    await this.repo.save(user);
    return user;
  }

  async findByDiscordId(discordId: string, guildId: string): Promise<User> {
    const user = await this.repo.findByDiscordId(discordId, guildId);
    if (!user) throw new NotFoundError("회원");
    return user;
  }

  async delete(discordId: string, guildId: string): Promise<void> {
    const user = await this.repo.findByDiscordId(discordId, guildId);
    if (!user) throw new NotFoundError("회원");
    await this.repo.delete(discordId, guildId);
  }
}