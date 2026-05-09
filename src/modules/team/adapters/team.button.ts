import { ButtonInteraction, MessageFlags } from "discord.js";
import { Handler } from "@/bot/routers/base.router.js";
import { BUTTONS } from "@/bot/constants/buttons.js";
import { handleError } from "@/shared/errors/handle-error.js";
import { TeamService } from "../domain/team.service.js";


export class TeamButton{
    constructor(private readonly teamService : TeamService) {}

    get accept() : Handler<ButtonInteraction> {
        return {
            handle : async (interaction : ButtonInteraction) =>{
                try {
                    const applicantId = interaction.customId
                    .replace(`${BUTTONS.TEAM_APPLICATION_ACCEPT}:`,'');

                    await this.teamService.acceptApplication(
                        interaction.user.id,
                        interaction.guildId!,
                        applicantId
                    );

                    await interaction.reply({
                        content : '팀원 수락이 완료됐습니다',
                        flags : MessageFlags.Ephemeral
                    });
                } catch(e){
                    await handleError(interaction, e);
                }
            }
        }
    }

    get reject() :Handler<ButtonInteraction>{
        return {
            handle : async (interaction : ButtonInteraction) => {
                try {
                    const applicantId = interaction.customId
                    .replace(`${BUTTONS.TEAM_APPLICATION_ACCEPT}:`,'');

                    await this.teamService.rejectApplication(
                        interaction.user.id,
                        interaction.guildId!,
                        applicantId
                    );

                    await interaction.reply({
                        content : '신청을 거절했습니다',
                        flags : MessageFlags.Ephemeral
                    });
                } catch (e) {
                    await handleError(interaction, e);
                }
            }
        }
    }
}