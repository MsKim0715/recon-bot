import { User as DiscordUser} from 'discord.js';
import { User  } from '../domain/user.entity.js';
import { buildInfoEmbed, buildSuccessEmbed } from '@/shared/embed/embed.builder.js';


export function registerSuccessEmbed(
  discordUser : DiscordUser,
  nickname : string
) {
  return buildSuccessEmbed(discordUser,{
    title : '회원 등록 완료',
    description : '/연동 으로 Riot 계정을 연동해보세요!',
    fields : [
      {name : '닉네임', value : nickname, inline : true},
      {name : 'Riot 연동', value : '미연동', inline : true},
    ]
  })
}

export function profileEmbed(
  discordUser : DiscordUser,
  user : User
) {
  return buildInfoEmbed({
    title : '회원 정보',
    thumbnail : discordUser.defaultAvatarURL,
    fields : [
      {name : '닉네임', value : user.username, inline : true},
      {name : 'Riot 연동', value : user.isRiotLinked() ? 'Y' : 'N', inline :true},
      {name : '티어', value : user.stats?.tierName ?? '미연동', inline : true},
    ]
  })
}