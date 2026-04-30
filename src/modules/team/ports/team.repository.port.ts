import { Team } from "../domain/team.entity.js";

export interface TeamRepositoryPort {
    findById(id : string) : Promise<Team | null>
    findByName(name : string, guildId : string) : Promise<Team | null>
    findByLeaderId(leaderId : string, guildId : string) : Promise<Team | null>
    save(team : Team) : Promise<void>
    update(id : string, team : Team) : Promise<void>
    delete(id : string) : Promise<void>
}