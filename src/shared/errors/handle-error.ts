import { MessageFlags, RepliableInteraction } from "discord.js";
import { AppError } from "./index.js";
import { logger } from "@/infra/logger.js";

export async function handleError(
  interaction: RepliableInteraction,
  error: unknown,
) {
  if (error instanceof AppError) {
    await interaction.reply({
      content: `${error.message}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  logger.error(error, "예상치 못한 오류 발생");
  await interaction.reply({
    content: "오류가 발생했습니다. 잠시 후 다시 시도해주세요",
    flags: MessageFlags.Ephemeral,
  });
}
