import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  User as DiscordUser,
} from 'discord.js';
import { User } from '../domain/user.entity.js';

export function registerSuccessComponents(
  discordUser: DiscordUser,
  nickname: string,
) {
  return new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## 회원 등록 완료'),
          new TextDisplayBuilder().setContent(`**${nickname}** 님 환영합니다!`),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(discordUser.displayAvatarURL())
        )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Riot 연동** | 미연동\n' +
        '`/link` 로 Riot 계정을 연동해보세요!'
      )
    );
}

export function profileComponents(
  discordUser: DiscordUser,
  user: User,
) {
  return new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## 회원 정보'),
          new TextDisplayBuilder().setContent(`**${user.username}**`),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(discordUser.displayAvatarURL())
        )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Riot 연동** : ${user.isRiotLinked() ? ' 연동됨' : ' 미연동'}\n` +
        `**티어** : ${user.tierName ?? '미연동'}`
      )
    );
}