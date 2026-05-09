import { RiotAccount } from "@/modules/riot/domain/value-objects/riot-account.value-object.js";


export interface RiotRepositoryPort{
    findByUserId(userId : string) : Promise<RiotAccount | null>;
    findByPuuid(puuid : string) : Promise<RiotAccount | null>;
    save(userId : string, account : RiotAccount) : Promise<void>;
    update(userId : string, account : RiotAccount) : Promise<void>;
    delete(userId : string) : Promise<void>;
}