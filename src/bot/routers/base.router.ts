import { MessageFlags, RepliableInteraction } from "discord.js";
import { logger } from "@/infra/logger.js";

export interface Handler<T> {
  handle(interaction: T): Promise<void>;
}

export class Router<T extends RepliableInteraction> {
  private map = new Map<string, Handler<T>>();

  register(id: string, handler: Handler<T>) {
    this.map.set(id, handler);
  }

  async route(id: string, interaction: T) {
    const handler = this.map.get(id);

    if (!handler) {
      logger.warn({ id }, "알 수 없는 핸들러");
      
        await interaction.reply({
          content: "처리할 수 없는 요청입니다",
          flags : MessageFlags.Ephemeral
        });
      
      return;
    }
    await handler.handle(interaction);
  }
}
