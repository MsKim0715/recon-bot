import { EmbedBuilder, User as DiscordUser , APIEmbedField} from "discord.js";



export type EmbedOptions = {
  title: string;
  color?: number;
  description?: string;
  fields?: APIEmbedField[]
  thumbnail?: string;
  footerText?: string;
  footerIcon?: string;
};

export function buildEmbed(options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setColor(options.color ?? 0x5865f2)
    .setTimestamp();

  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.fields) embed.addFields(options.fields);
  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: options.footerIcon,
    });
  }

  return embed;
}
export function buildSuccessEmbed(
    discordUser : DiscordUser,
    options : Omit<EmbedOptions, 'color'>
) : EmbedBuilder {
    return buildEmbed({
        ...options,
        color: 0x57F287,
        thumbnail : discordUser.displayAvatarURL(),
        footerText : options.footerText ?? discordUser.username,
        footerIcon : options.footerIcon ?? discordUser.defaultAvatarURL,
    })
}

export function buildInfoEmbed(
    options : Omit<EmbedOptions, 'color'>
) : EmbedBuilder {
    return buildEmbed({
        ...options,
        color : 0x5865F2,
    })
}

export function buildErrorEmbed(message : string) : EmbedBuilder{
    return buildEmbed({
        title : '오류',
        color : 0xED4245,
        description : message,
    })
}