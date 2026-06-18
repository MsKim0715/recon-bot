import {
  GuildMember,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { env } from "@/env.js";
import { logger } from "@/infra/logger.js";

// 온보딩 환영 카드 (리콘봇 시작 흐름 안내)
function welcomeComponents(member: GuildMember) {
  return new ContainerBuilder()
    .setAccentColor(0x57f287)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 환영합니다, ${member.toString()}! 👋`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**리콘 봇**으로 발로란트 스크림을 관리해보세요.\n\n" +
          "**시작하기**\n" +
          "1. `/회원등록` — 먼저 회원으로 등록\n" +
          "2. `/계정연동` — Riot 계정 연동 (티어·전적)\n" +
          "3. `/팀` — 팀 생성 또는 가입\n" +
          "4. `/스크림` — 스크림 모집·신청\n\n" +
          "경기 결과는 `/경기목록` 에서 입력할 수 있어요.",
      ),
    );
}

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  // 봇 계정 입장은 환영하지 않음
        logger.info({ tag: member.user.tag }, "입장 감지됨");  
  if (member.user.bot) return;

  const channelId = env.WELCOME_CHANNEL_ID;
  logger.info({ channelId }, "환영 채널 ID"); 
  if (!channelId) return; // 미설정이면 조용히 skip

  try {
    const channel = await member.guild.channels
      .fetch(channelId)
      .catch(() => null);


    if (!channel || !channel.isTextBased()) {
      logger.warn(
        { channelId, guildId: member.guild.id },
        "환영 채널을 찾을 수 없거나 텍스트 채널이 아님",
      );
      return;
    }

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [welcomeComponents(member)],
    });
  } catch (e) {
    logger.warn(
      { err: e instanceof Error ? e.message : e, userId: member.id },
      "환영 메시지 전송 실패",
    );
  }
}   