import { ModalSubmitInteraction, MessageFlags } from "discord.js";
import { Handler } from "@/bot/routers/base.router.js";
import { TeamService } from "../domain/team.service.js";
import { teamCreatedEmbed } from "./team.embed.js";
import { AppError } from "@/shared/errors/index.js";


export class TeamModal{
    constructor(private readonly teamService : TeamService){}

    get create() : Handler<ModalSubmitInteraction> {
        return {
            handle : async (interaction : ModalSubmitInteraction) => {
                try {
                    const name = interaction.fields.getTextInputValue('name');
                    const description = interaction.fields.getTextInputValue('description');

                    const team = await this.teamService.create(
                        interaction.user.id,
                        interaction.guildId!,
                        name,
                        description
                    )
                    await interaction.reply({
                        embeds : [teamCreatedEmbed(interaction.user, team)],
                        flags : MessageFlags.Ephemeral
                    })
                } catch (e) {
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