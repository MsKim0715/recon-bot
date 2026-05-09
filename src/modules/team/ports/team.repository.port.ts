import { Team } from "../domain/team.entity.js";
import { ApplicationStatus } from "@/generated/prisma/index.js";

export interface TeamApplicationData{
    id : string,
    teamId : string,
    userId : string,
    guildId : string,
    status : string,
    createdAt : Date 

}


export interface TeamRepositoryPort {
    findById(id : string) : Promise<Team | null>
    findByName(name : string, guildId : string) : Promise<Team | null>
    findByLeaderId(leaderId : string, guildId : string) : Promise<Team | null>
    findAllByGuildId(guildId : string) : Promise<Team[]>
    existsByName(name : string, guildId : string) : Promise<boolean>
    existsByLeaderId(leaderId : string, guildId : string) : Promise<boolean>
    save(team : Team) : Promise<void>
    update(id : string, team : Team) : Promise<void>
    delete(id : string) : Promise<void>

    addMember(teamId : string, userId : string) : Promise<void>
    removeMember(teamId : string, userId : string) : Promise<void>
    isMember(teamId : string, userId : string) : Promise<boolean>

    createApplication(teamId : string, userId : string, guildId : string) : Promise<void>
    findApplications(teamId : string) : Promise<TeamApplicationData[]>
    findApplication(teamId : string, userId :  string) : Promise<TeamApplicationData | null>
    updateApplicationStatus(teamId : string, userId : string, status : ApplicationStatus) : Promise<void>
    existsApplication(teamId : string  , userId : string,) : Promise<boolean>
}   