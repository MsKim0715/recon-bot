import { logger } from "@/infra/logger.js";
import { Interaction } from "discord.js";
import { InteractionDispatcher } from "../dispatcher/interaction.dispatcher.js";


export function createInteractionHandler(router : InteractionDispatcher){
    return async (interaction : Interaction) => {
        try{
            await router.dispatch(interaction);
        }
        catch(e){
            logger.error(e, '인터랙션 처리 오류');
        }
    }
}