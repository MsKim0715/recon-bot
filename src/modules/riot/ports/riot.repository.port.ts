import { RiotAccount } from "../domain/riot.entity.js";



export interface RiotRepositoryPort{
    findByUserId(userId : string) : Promise<RiotAccount | null>;
    findByPuuid(puuid : string) : Promise<RiotAccount | null>;
    save(userId : string, account : RiotAccount) : Promise<void>;
    update(userId : string, account : RiotAccount) : Promise<void>;
    delete(userId : string) : Promise<void>;
    resolveUserId(discordId: string, guildId: string): Promise<string | null>;
    findAllWithUserIds(): Promise<{ userId: string; account: RiotAccount }[]>;
}