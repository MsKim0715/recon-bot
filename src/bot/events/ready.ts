import { Client } from "discord.js";
import { logger } from "@/infra/logger.js";

export function handleReady(client : Client){
    logger.info(`봇 온라인 : ${client.user?.tag}`);
}