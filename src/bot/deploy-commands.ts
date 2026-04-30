import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { env } from "@/env.js";
import { logger } from "@/infra/logger.js";
import { commandEntries } from "./registry.js";


const rest = new REST().setToken(env.DISCORD_TOKEN);


export async function deployCommands() {
    try{
        logger.info('슬래시 커맨드 등록 시작');

        await rest.put(
            Routes.applicationGuildCommands(
                env.DISCORD_CLIENT_ID,
                env.DISCORD_GUILD_ID
            ),
            {body : commandEntries.map(m=> m.def.toJSON())}
        )

        logger.info('슬래시 커맨드 등록 완료');
    }catch(e){
        logger.error(e, '슬래시 커맨드 등록 실패');
    }
    
}