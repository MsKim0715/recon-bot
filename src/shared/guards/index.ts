import { NotFoundError, PermissionError, UnregisterError } from "../errors/index.js";
import { prisma } from "@/infra/database.js";

export async function guardIsLeader(userId: string, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  if (!team || team.leaderId !== userId) {
    throw new PermissionError("팀 리더만 가능합니다");
  }
}

export async function guardIsMember(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!member) {
    throw new PermissionError("팀 멤버만 가능합니다");
  }
}

export async function  guardIsRegistered(
  discordId : string,
  guildId : string

) : Promise<void> {
  const user = await prisma.user.findUnique({
    where : { discordId_guildId : {discordId, guildId}}
  })
  if(!user) throw new UnregisterError();
}