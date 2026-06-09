import {
    ModalSubmitInteraction,
    MessageFlags,
} from 'discord.js';
import { Handler } from '@/bot/routers/base.router.js';
import { UserService } from '../domain/user.service.js';

import { registerSuccessComponents } from './user.components.js';
import { handleError } from '@/shared/errors/handle-error.js';


export class UserModal{

    constructor(private readonly userService : UserService) {}

    get register() : Handler<ModalSubmitInteraction> {
        return {
            handle :  async (interaction : ModalSubmitInteraction) => {
                try {
                    const nickname = interaction.fields.getTextInputValue('nickname');

                    await this.userService.register(
                        interaction.user.id,
                        interaction.guildId!,
                        nickname
                    )


                    await interaction.reply({
                        components : [registerSuccessComponents(interaction.user,nickname)],
                        flags : MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                    })
                    
                }catch(e){
                    handleError(interaction, e);
                }
                
            }
        }
    }


}