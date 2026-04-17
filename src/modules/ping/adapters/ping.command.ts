import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "@/bot/constants/commands.js";


export const pingCommandDef = new SlashCommandBuilder()
    .setName(COMMANDS.PING)
    .setDescription('봇 응답 테스트')


export const pingCommand = {
    async handle(interaction : ChatInputCommandInteraction){
        await interaction.reply({
            content : 'Pong!',
            flags : MessageFlags.Ephemeral
        });
    }
}