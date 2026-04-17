import { logger } from "@/infra/logger.js";
import { Interaction } from "discord.js";
import { commandRouter } from "../routers/command.router.js";

export async function handleInteraction(interaction : Interaction) {
   
    try {
        if(interaction.isChatInputCommand()){
            logger.info({
                command : interaction.commandName,
                userId : interaction.user.id,
                guildId : interaction.guildId
            }, '커맨드 실행');
            return await commandRouter.route(interaction.commandName,interaction);
        }
        
    }catch(e){
        logger.error(e, '인터랙션 처리 오류');
    }
}