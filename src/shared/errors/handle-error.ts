import {
  MessageFlags,
  RepliableInteraction,
  ContainerBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { AppError } from "./index.js";
import { logger } from "@/infra/logger.js";

function errorComponent(message: string) {
  return new ContainerBuilder()
    .setAccentColor(0xed4245) // 빨강
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`⚠️ ${message}`),
    );
}

export async function handleError(
  interaction: RepliableInteraction,
  error: unknown,
) {
  const message =
    error instanceof AppError
      ? error.message
      : "오류가 발생했습니다. 잠시 후 다시 시도해주세요";

  if (!(error instanceof AppError)) {
    logger.error(error, "예상치 못한 오류 발생");
  }

  try {
    if (interaction.deferred || interaction.replied) {
      // 이미 defer/응답된 경우 → V2 컴포넌트로 editReply (IsComponentsV2 는 editReply 쪽에 명시)
      await interaction.editReply({
        components: [errorComponent(message)],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      await interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch {
    // editReply 실패 시 별도 메시지로 폴백
    try {
      await interaction.followUp({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      logger.error(e, "에러 응답 전송 실패");
    }
  }
}
