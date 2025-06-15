import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";
import "./keepAlive.js";
config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const BANNED_ROLE_ID = "1382983036206973028"; // Replace with your actual "minor" role ID
const GUILD_IDS = ["1382756114688639127", "1382982812197589114"]; // All guilds to sync bans to

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
  console.log("✅ Connected guilds:", client.guilds.cache.map(g => `${g.name} (${g.id})`).join(", "));
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  console.log(`[DEBUG] GuildMemberUpdate triggered for ${newMember.user.tag}`);

  const oldRoleIds = new Set(oldMember.roles.cache.map(role => role.id));
  const newRoleIds = new Set(newMember.roles.cache.map(role => role.id));
  const addedRoleIds = [...newRoleIds].filter(id => !oldRoleIds.has(id));

  console.log(`[DEBUG] Roles added to ${newMember.user.tag}:`, addedRoleIds);
  if (!addedRoleIds.includes(BANNED_ROLE_ID)) {
    console.log(`[DEBUG] Banned role (${BANNED_ROLE_ID}) was not among added roles.`);
    return;
  }

  console.log(`🚨 Banned role added to ${newMember.user.tag}`);

  if (newMember.user.bot) return;

  try {
    await newMember.send(
      `You have been banned from **DEMON TIME 18+** due to selecting minor role. If you would like to appeal, join here. 
      ‎||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||

_ _
# _ _ 
-# _ _ 
https://discord.gg/VarTGVQQac
    `);
    console.log(`📬 DM sent to ${newMember.user.tag}`);
  } catch (err) {
    console.warn("❌ Failed to DM user:", err);
  }

  for (const guildId of GUILD_IDS) {
    console.log(`[DEBUG] Attempting to fetch guild ID: ${guildId}`);
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.warn(`⚠️ Guild not found: ${guildId}`);
      continue;
    }

    try {
      const botMember = guild.members.me;
      const targetMember = await guild.members.fetch(newMember.id).catch(() => null);

      console.log(`[DEBUG] Preparing to ban in ${guild.name}`);
      console.log(`[DEBUG] Bot role: ${botMember?.roles?.highest.name} (${botMember?.roles?.highest?.position})`);
      console.log(`[DEBUG] Target: ${targetMember?.user.tag ?? newMember.id}`);
      console.log(`[DEBUG] Target role: ${targetMember?.roles?.highest?.name} (${targetMember?.roles?.highest?.position})`);

      if (!targetMember) {
        console.warn(`⚠️ Member ${newMember.id} not found in ${guild.name}, banning by ID`);
        await guild.bans.create(newMember.id, {
          reason: "Banned role assigned (auto-ban, user not in server)"
        });
        console.log(`🔨 Banned user ID ${newMember.id} from ${guild.name} via bans.create`);
        continue;
      }

      await guild.members.ban(newMember.id, {
        reason: "dumbass nigga picked the minor role"
      });
      console.log(`🔨 Banned ${newMember.user.tag} from ${guild.name}`);
    } catch (err) {
      console.error(`❌ Failed to ban in ${guild.name}:`, err);
      console.trace("🔍 Ban stack trace");
      console.dir(err, { depth: 2 });
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.content === "$checkme" && message.guild) {
    const member = await message.guild.members.fetch(message.author.id);
    const roles = member.roles.cache.map(role => `${role.name} (${role.id})`);
    console.log(`[DEBUG] ${message.author.tag} has roles:`, roles);

    message.reply({
      content: `Your roles:
${roles.join("\n") || "None"}`
    });
  }

  // ✅ Ping command added here without changing any existing logic
  if (message.content === "$ping") {
    const sent = await message.channel.send("sigh...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    sent.edit(`nosy ass nigga. Latency is ${latency}ms. API Latency is ${apiLatency}ms.`);
  }
});


// ============================
// 🚨 Additional Ban Commands
// ============================
const BAN_PERMISSION_ROLE_ID = "1383850930155421838"; // Replace with your actual moderator role ID

function getBanDMMessage(reason) {
  return `You Have Been Cross-Server Banned for ${reason}. If you would like to appeal, join here. 
      ‎||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||||‍||

_ _
# _ _ 
-# _ _ 
https://discord.gg/VarTGVQQac`;
}

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;

  if (message.content === "$dmcheck") {
    const dmMessage = getBanDMMessage("selecting minor role");
    console.log("[DMCHECK] Requested by", message.author.tag);
    return message.reply(dmMessage);
  }

  if (message.content === "$bancheck") {
    const dmMessage = getBanDMMessage("custom ban reason");
    console.log("[BANCHECK] Requested by", message.author.tag);
    return message.reply(dmMessage);
  }

  if (message.content.startsWith("$ban ")) {
    const parts = message.content.split(" ");
    const userId = parts[1];
    const reason = parts.slice(2).join(" ") || "No reason provided.";

    const authorMember = await message.guild.members.fetch(message.author.id);
    const role = authorMember.roles.highest;
    const minAllowedRole = message.guild.roles.cache.get(BAN_PERMISSION_ROLE_ID);

    if (!minAllowedRole || role.comparePositionTo(minAllowedRole) < 0) {
      return message.reply("❌ You do not have permission to use this command.");
    }

    console.log(`[COMMAND] $ban issued by ${message.author.tag} on ${userId} with reason: ${reason}`);

    let dmSent = false;
    let banSucceeded = false;

    try {
      const user = await client.users.fetch(userId);
      await user.send(getBanDMMessage(reason));
      console.log(`📬 DM sent to ${user.tag}`);
      dmSent = true;
    } catch (err) {
      console.warn(`❌ Failed to DM user ${userId}:`, err);
    }

    for (const guildId of GUILD_IDS) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        console.warn(`⚠️ Guild not found: ${guildId}`);
        continue;
      }

      try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          await guild.bans.create(userId, {
            reason: `Network ban: ${reason}`,
          });
        } else {
          await member.ban({
            reason: `Network ban: ${reason}`,
          });
        }
        banSucceeded = true;
      } catch (err) {
        console.error(`❌ Failed to ban ${userId} in ${guild.name}:`, err);
      }
    }

    if (banSucceeded) {
      return message.reply({
        content: `that nigga dead, the dm ${dmSent ? "was sent too type shit" : "aint send tho"}.`,
        allowedMentions: { users: [] },
      });
    } else {
      return message.reply(`yo dis shit not workin cuh they may not exist or already be banned.`);
    }
  }
});


client.on(Events.GuildBanAdd, async ban => {
  if (ban.user.bot) return;
  console.log(`📛 User ${ban.user.tag} was banned in ${ban.guild.name}`);
});

if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN environment variable is not set. Please check your .env file.");
  process.exit(1);
}

client.login(process.env.BOT_TOKEN);
