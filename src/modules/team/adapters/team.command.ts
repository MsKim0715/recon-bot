import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags
} from 'discord.js';
import {COMMANDS} from '@/bot/constants/commands.js';
import { Handler } from '@/bot/routers/base.router.js';
import { TeamService } from '../domain/team.service.js';
import { buildTeamCreateModal } from './team.modal-ui.js';
import { teamProfileEmbed } from './team.embed.js';
import { AppError } from '@/shared/errors/index.js';


export const teamCreateCommandDef = new SlashCommandBuilder()
.setName(COMMANDS.TEAM_CREATE)
.setDescription('Team creation')
.setNameLocalizations({ko :'팀생성'})
.setDescriptionLocalizations({ ko : '새로운 팀을 생성합니다'});

export const teamViewCommandDef = new SlashCommandBuilder()
.setName(COMMANDS.TEAM_VIEW)
.setDescription('Team information')
.setNameLocalizations({ko : '팀조회'})
.setDescriptionLocalizations({ko : '팀 정보를 조회합니다'});

export class TeamCommand{
    constructor(private readonly teamService : TeamService) {}


    get create(): Handler<ChatInputCommandInteraction>{
        return {
            handle : async (interaction : ChatInputCommandInteraction) => {
                await interaction.showModal(buildTeamCreateModal())
            }
        }
    }

    get view(): Handler<ChatInputCommandInteraction>{
        return {
            handle : async(interaction : ChatInputCommandInteraction) => {
                try{
                    const team = await this.teamService.findByLeaderId(
                        interaction.user.id,
                        interaction.guildId!
                    )

                    await interaction.reply({
                        embeds : [teamProfileEmbed(team)],
                        flags : MessageFlags.Ephemeral
                    })
                }catch(e){
                    if(e instanceof AppError){
                        await interaction.reply({
                            content : `${e.message}`,
                            flags : MessageFlags.Ephemeral
                        })
                    }
                }
            }
        }
    }

}