import { Client, GatewayIntentBits } from "discord.js";
import { env } from "@/env.js";
import { handleReady } from "./events/ready.js";
import { handleInteraction } from "./events/InteractionCreate.js";
import { registerAllCommands } from "./registry.js";
import { deployCommands } from "./deploy-commands.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("clientReady", (c) => {
   handleReady(c);
});

client.on('interactionCreate', async (interaction) =>{
  await handleInteraction(interaction);
})

export async function startBot() {
  registerAllCommands();
  await deployCommands();
  await client.login(env.DISCORD_TOKEN);
}
