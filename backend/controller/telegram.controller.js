import { Telegraf } from "telegraf";
import Incident from "../models/incident.model.js";
import User from "../models/user.models.js";
import {
  getSession,
  setSession,
  deleteSession,
} from "../utils/session-manager.js";
import {
  analyzeVision,
  processTextIntelligence,
} from "../utils/ai-analysis.js";
import forensicsModule from "../utils/forensics.js";
const { analyzeForensics } = forensicsModule;
import { calculateTrustScore } from "../utils/scoring.js";
import { determinePriorityCode } from "../utils/priority-coding.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ==================== SINGLETON GUARD ====================
// Prevents multiple instances from being created during nodemon hot-reloads
let bot = null;
let isBotRunning = false;

const getBot = () => {
  if (!bot) {
    bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    console.log("🤖 Telegraf bot instance created (singleton)");
    registerHandlers(bot);
  }
  return bot;
};

// ==================== HELPERS ====================
const getSessionKey = (chatId) => `tg_${chatId}`;

const buildProgressMessage = (session) => {
  const m = session.incidentData.mediaUploaded;
  const hasLoc = m.includes("location");
  const hasText = m.includes("text");
  const hasImg = m.includes("image");

  let msg = `📊 *Progress (ALL MANDATORY):*\n`;
  msg += `   ${hasLoc ? "✅" : "❌"} Location\n`;
  msg += `   ${hasText ? "✅" : "❌"} Description (Text)\n`;
  msg += `   ${hasImg ? "✅" : "❌"} Image (Photo)\n\n`;

  if (hasLoc && hasText && hasImg) {
    msg += `🟢 *Ready to submit!*\nType /submit to create your SOS report.`;
  } else {
    const needed = [];
    if (!hasLoc) needed.push("📍 Location");
    if (!hasText) needed.push("💬 Description");
    if (!hasImg) needed.push("📸 Image");
    msg += `🔴 *STILL NEED:* ${needed.join(" + ")}`;
  }
  return msg;
};

// ==================== REGISTER HANDLERS (called once on singleton creation) ====================
function registerHandlers(botInstance) {
  console.log("🔧 Registering Telegram bot handlers...");

  // SOS Initiation
  botInstance.command(["start", "sos"], async (ctx) => {
    const chatId = ctx.chat.id;
    const user_tg = ctx.from;
    const sessionKey = getSessionKey(chatId);

    console.log(`🔥 TELEGRAM SOS TRIGGERED: ${chatId} (${user_tg.username || "no-username"})`);

    let user = await User.findOne({ email: `tg_${chatId}@sos.local` });
    if (!user) {
      user = new User({
        name: user_tg.first_name + (user_tg.last_name ? ` ${user_tg.last_name}` : ""),
        email: `tg_${chatId}@sos.local`,
        role: "citizen",
      });
      await user.save();
    }

    const session = {
      userId: user._id,
      chatId: chatId,
      type: "TELEGRAM",
      incidentData: {
        type: "Other",
        severity: "Low",
        mode: "IMAGE_TEXT",
        description: "",
        location: { type: "Point", coordinates: [0, 0] },
        reportedBy: user._id,
        imageUrl: null,
        imageBase64: null,
        mediaUploaded: [],
        telegramChatId: chatId.toString(),
        telegramUsername: user_tg.username || "unknown",
        forensics: null,
        aiAnalysis: {
          vision: { detected: [], confidence: 0, model: "" },
          voice: { keywords: [], sentiment: "", confidence: 0, model: "" },
          semantics: { alignment: 0, description: "", model: "" },
        },
      },
      step: "collecting",
      createdAt: new Date(),
    };

    await setSession(sessionKey, session);

    const welcomeMsg = `🚨 *EMERGENCY SOS SYSTEM (TELEGRAM)* 🚨

You are now in *SOS Mode*.

*ALL 3 FIELDS ARE MANDATORY:*

1️⃣ 📍 *Share your LOCATION*
   → Tap 📎 (Paperclip) → Location

2️⃣ 💬 *Type a DESCRIPTION*
   → e.g., "Fire in building near central station"

3️⃣ 📸 *Send an IMAGE/PHOTO*
   → Photo of the incident (MUST be a direct photo)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
When you have sent ALL 3, type /submit
To cancel, type /cancel
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 *Start now!*`;

    await ctx.replyWithMarkdown(welcomeMsg);
  });

  // Cancel Session
  botInstance.command("cancel", async (ctx) => {
    const chatId = ctx.chat.id;
    await deleteSession(getSessionKey(chatId));
    await ctx.reply("❌ SOS session cancelled. Use /sos to start again.");
  });

  // Submit Session
  botInstance.command("submit", async (ctx) => {
    const chatId = ctx.chat.id;
    const session = await getSession(getSessionKey(chatId));

    if (!session) {
      return ctx.reply("❌ No active SOS session. Use /sos to start.");
    }

    const { incidentData } = session;
    const hasLoc = incidentData.mediaUploaded.includes("location");
    const hasText = incidentData.mediaUploaded.includes("text");
    const hasImg = incidentData.mediaUploaded.includes("image");

    if (!hasLoc || !hasText || !hasImg) {
      return ctx.replyWithMarkdown(`⚠️ *Incomplete Report*\n\n${buildProgressMessage(session)}`);
    }

    await ctx.reply("⏳ Submitting your report with AI verification...");

    try {
      const [longitude, latitude] = incidentData.location.coordinates;

      // 1. Calculate Trust Score
      const trustScore = await calculateTrustScore(
        incidentData.mode,
        incidentData.forensics || { realismFactor: 1.0, isFake: false, confidenceScore: 0 },
        incidentData.aiAnalysis.vision,
        incidentData.aiAnalysis.voice || { keywords: [], sentiment: "neutral" },
        { alignmentScore: 70 }, // Default semantics for text-only
        latitude,
        longitude
      );

      // 2. Determine Priority Code
      const priorityCode = await determinePriorityCode(
        trustScore,
        incidentData.forensics || { realismFactor: 1.0, isFake: false, confidenceScore: 0 },
        incidentData.aiAnalysis.voice || { keywords: [], sentiment: "neutral" },
        incidentData.aiAnalysis.vision,
        trustScore.locationConsensus,
        latitude,
        longitude
      );

      // 3. Determine Status and Severity
      let status = "Pending";
      if (priorityCode.code === "X-RAY") status = "Spam";

      // Map priority code to severity for the Incident model
      let severity = "Low";
      if (["OMEGA", "DELTA"].includes(priorityCode.code)) severity = "Critical";
      else if (priorityCode.code === "CHARLIE") severity = "High";
      else if (priorityCode.code === "BRAVO") severity = "Medium";

      const incident = new Incident({
        ...incidentData,
        trustScore,
        priorityCode,
        severity,
        status,
        verificationLog: [
          { phase: "forensics", timestamp: new Date(), result: incidentData.forensics },
          { phase: "scoring", timestamp: new Date(), result: trustScore },
          { phase: "priority", timestamp: new Date(), result: priorityCode }
        ]
      });

      await incident.save();
      await deleteSession(getSessionKey(chatId));

      await ctx.replyWithMarkdown(`✅ *INCIDENT REPORTED SUCCESSFULLY!*

🆔 *Incident ID:* \`${incident._id}\`
📊 *Trust Score:* ${trustScore.totalScore.toFixed(1)}/100
🔴 *Priority:* ${priorityCode.code}
📋 *Status:* ${status}

Our emergency team has been notified.`);
    } catch (err) {
      console.error("❌ Submission error:", err.message);
      await ctx.reply("❌ Error submitting report. Please try again.");
    }
  });

  // Handle Location
  botInstance.on("location", async (ctx) => {
    const chatId = ctx.chat.id;
    const session = await getSession(getSessionKey(chatId));
    if (!session) return;

    const { latitude, longitude } = ctx.message.location;
    session.incidentData.location = { type: "Point", coordinates: [longitude, latitude] };

    if (!session.incidentData.mediaUploaded.includes("location")) {
      session.incidentData.mediaUploaded.push("location");
    }

    await setSession(getSessionKey(chatId), session);
    await ctx.replyWithMarkdown(`✅ *Location Saved!*\n📍 \`${latitude.toFixed(4)}, ${longitude.toFixed(4)}\`\n\n${buildProgressMessage(session)}`);
  });

  // Handle Photo
  botInstance.on("photo", async (ctx) => {
    const chatId = ctx.chat.id;
    const session = await getSession(getSessionKey(chatId));
    if (!session) return;

    await ctx.reply("📸 Processing image with AI Forensics...");

    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString("base64");

      const forensics = await analyzeForensics(buffer, "UPLOAD", base64);
      const vision = await analyzeVision(base64);

      session.incidentData.imageUrl = fileLink.href;
      session.incidentData.imageBase64 = base64;
      session.incidentData.forensics = forensics;
      session.incidentData.aiAnalysis.vision = vision;

      if (!session.incidentData.mediaUploaded.includes("image")) {
        session.incidentData.mediaUploaded.push("image");
      }

      await setSession(getSessionKey(chatId), session);
      await ctx.replyWithMarkdown(`✅ *Image Processed!*\n${forensics.isFake ? "🚨 *Potential authenticity issue detected!*" : "Verified authentic photo."}\n\n${buildProgressMessage(session)}`);
    } catch (err) {
      console.error("❌ Photo processing error:", err.message);
      await ctx.reply("⚠️ Image received but analysis failed. It will be marked for manual review.");

      if (!session.incidentData.mediaUploaded.includes("image")) {
        session.incidentData.mediaUploaded.push("image");
      }
      await setSession(getSessionKey(chatId), session);
    }
  });

  // Handle Text
  botInstance.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    if (text.startsWith("/")) return;

    const session = await getSession(getSessionKey(chatId));
    if (!session) return;

    await ctx.reply("💬 Analyzing description...");

    try {
      const intel = await processTextIntelligence(text);
      session.incidentData.description = intel.translatedText;
      session.incidentData.type = intel.detectedType;

      if (!session.incidentData.mediaUploaded.includes("text")) {
        session.incidentData.mediaUploaded.push("text");
      }

      await setSession(getSessionKey(chatId), session);
      await ctx.replyWithMarkdown(`✅ *Description Saved!*\n🏷️ Type: *${intel.detectedType}*\n\n${buildProgressMessage(session)}`);
    } catch (err) {
      console.error("❌ Text processing error:", err.message);
      session.incidentData.description = text;
      if (!session.incidentData.mediaUploaded.includes("text")) {
        session.incidentData.mediaUploaded.push("text");
      }
      await setSession(getSessionKey(chatId), session);
      await ctx.replyWithMarkdown(`✅ *Description Saved (Manual Review Required)*\n\n${buildProgressMessage(session)}`);
    }
  });

  console.log("✅ Telegram bot handlers registered");
}

// ==================== WEBHOOK HANDLER FOR EXPRESS ====================
export const handleTelegramWebhook = async (req, res) => {
  try {
    await getBot().handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(500).send("Error");
  }
};

// ==================== START BOT (POLLING with 409 guard) ====================
export const startBot = async () => {
  // ✅ Guard: don't start if already running (protects against nodemon double-launch)
  if (isBotRunning) {
    console.log("⚠️ Telegram bot already running — skipping re-launch");
    return;
  }

  const botInstance = getBot();

  try {
    // ✅ Step 1: Delete any stale webhook that might be blocking polling
    await botInstance.telegram.deleteWebhook({ drop_pending_updates: false });
    console.log("🔧 Stale webhook cleared");

    // ✅ Step 2: 2s delay so Telegram can release the previous getUpdates session
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // ✅ Step 3: Launch polling
    await botInstance.launch({
      allowedUpdates: ["message", "callback_query"],
    });

    isBotRunning = true;
    console.log("🤖 Telegram Bot started via Polling ✅");

    // ✅ Step 4: Graceful shutdown — ensures polling releases before process exits
    process.once("SIGINT", () => {
      console.log("🛑 SIGINT: Stopping Telegram bot...");
      botInstance.stop("SIGINT");
      isBotRunning = false;
    });
    process.once("SIGTERM", () => {
      console.log("🛑 SIGTERM: Stopping Telegram bot...");
      botInstance.stop("SIGTERM");
      isBotRunning = false;
    });
  } catch (err) {
    isBotRunning = false;
    if (err.message.includes("409")) {
      // ✅ Retry after 5s if Telegram's side hasn't released yet
      console.warn("⚠️ Telegram 409 Conflict: Another session is still active on Telegram's side. Retrying in 5s...");
      setTimeout(() => startBot(), 5000);
    } else {
      console.error("❌ Telegram Bot failed to start:", err.message);
    }
  }
};

export default {
  handleTelegramWebhook,
  startBot,
};
