import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { Handler, Router } from "./base.router.js";



class CommandRouter extends Router<ChatInputCommandInteraction> {
    register(id: string, handler: Handler<ChatInputCommandInteraction<CacheType>>): void {
        super.register(id, handler);
    }

    async route(id: string, interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        await super.route(id, interaction);
    }
}

export const commandRouter = new CommandRouter();