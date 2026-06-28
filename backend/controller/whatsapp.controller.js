// import Incident from "../models/incident.model.js";
// import User from "../models/user.models.js";
// import Resource from "../models/resource.model.js";
// import { 
//   sendAutoReply, 
//   downloadMediaFromWhapi,
//   downloadMediaAsBase64 
// } from "../utils/whapi.js";
// import {
//   getSession,
//   setSession,
//   deleteSession,
// } from "../utils/session-manager.js";
// import {
//   analyzeVision,
//   analyzeSemantics,
//   processTextIntelligence,
// } from "../utils/ai-analysis.js";
// import { calculateTrustScore } from "../utils/scoring.js";
// import { determinePriorityCode } from "../utils/priority-coding.js";
// import forensicsModule from "../utils/forensics.js";

// const { analyzeForensics } = forensicsModule;

// // ==================== HELPERS ====================
// const extractPhoneFromChatId = (chatId) => {
//   const match = chatId.match(/(\d{10,15})@/);
//   return match ? match[1] : null;
// };

// const formatPhoneToChatId = (phone) => {
//   const cleanPhone = phone.replace(/\D/g, "");
//   return `${cleanPhone}@s.whatsapp.net`;
// };

// const processedMessageIds = new Set();

// function trackMessage(id) {
//   if (processedMessageIds.has(id)) return false;
//   processedMessageIds.add(id);
//   if (processedMessageIds.size > 500) {
//     const first = processedMessageIds.values().next().value;
//     if (first) processedMessageIds.delete(first);
//   }
//   return true;
// }

// const buildProgressMessage = (session) => {
//   const m = session.incidentData.mediaUploaded;
//   const hasLoc = m.includes("location");
//   const hasText = m.includes("text");
//   const hasImg = m.includes("image");

//   let msg = `📊 *Progress (ALL MANDATORY):*\n`;
//   msg += `   ${hasLoc ? "✅" : "❌"} Location\n`;
//   msg += `   ${hasText ? "✅" : "❌"} Description (Text)\n`;
//   msg += `   ${hasImg ? "✅" : "❌"} Image (Photo)\n\n`;

//   if (hasLoc && hasText && hasImg) {
//     msg += `🟢 *Ready to submit!*\nType *SUBMIT* to create your SOS report.`;
//   } else {
//     const needed = [];
//     if (!hasLoc) needed.push("📍 Location");
//     if (!hasText) needed.push("💬 Description");
//     if (!hasImg) needed.push("📸 Image");
//     msg += `🔴 *STILL NEED:* ${needed.join(" + ")}`;
//   }
//   return msg;
// };

// // ================================================================
// //  MAIN WEBHOOK — Only responds to "hi"/"sos" or active sessions
// // ================================================================
// export const handleIncomingWhatsAppMessage = async (req, res) => {
//   console.log("\n" + "█".repeat(80));
//   console.log("█ 📨 WHATSAPP WEBHOOK RECEIVED");
//   console.log("█".repeat(80));

//   try {
//     res.status(200).json({
//       success: true,
//       message: "Webhook received",
//     });

//     const { messages } = req.body;

//     if (!messages || messages.length === 0) {
//       console.log("⚠️ No messages in webhook");
//       return;
//     }

//     console.log(`\n📨 Received ${messages.length} message(s)`);

//     for (const message of messages) {
//       try {
//         await processMessage(message);
//       } catch (err) {
//         console.error(
//           `❌ Error processing message ${message.id}:`,
//           err.message
//         );
//       }
//     }
//   } catch (error) {
//     console.error("❌ WEBHOOK ERROR:", error.message, error.stack);
//     if (!res.headersSent) {
//       res.status(200).json({
//         success: true,
//         message: "Webhook received (error processing)",
//       });
//     }
//   }

//   console.log("█".repeat(80) + "\n");
// };

// // ================================================================
// //  PROCESS MESSAGE - ONLY TRIGGER ON "hi"/"sos" OR ACTIVE SESSION
// // ================================================================
// async function processMessage(message) {
//   // Skip our own outgoing messages
//   if (message.from_me) {
//     console.log("⏭️ Skipping: Message sent by us");
//     return;
//   }

//   // Dedupe
//   if (message.id && !trackMessage(message.id)) {
//     console.log(`⏭️ Skipping: Duplicate message ID ${message.id}`);
//     return;
//   }

//   const senderChatId = message.chat_id || message.from;
//   if (!senderChatId) {
//     console.log("❌ No chat ID found");
//     return;
//   }

//   const senderPhone = extractPhoneFromChatId(senderChatId);
//   if (!senderPhone) {
//     console.log("❌ Could not extract phone from:", senderChatId);
//     return;
//   }

//   const messageType = message.type;
//   const messageBody = (message.text?.body || "").trim();
//   const lowerBody = messageBody.toLowerCase();

//   console.log(
//     `\n📱 [${senderPhone}] type=${messageType} body="${messageBody
//       .substring(0, 50)
//       .trim()}..."`
//   );

//   // ==================== STEP 1: Check for TRIGGER "hi" or "sos" ====================
//   if (
//     messageType === "text" &&
//     (lowerBody === "hi" || lowerBody === "sos")
//   ) {
//     console.log(`🔥 TRIGGER DETECTED: "${lowerBody}"`);
//     await handleTrigger(senderPhone, senderChatId);
//     return;
//   }

//   // ==================== STEP 2: Check for active session ====================
//   const session = await getSession(senderPhone);

//   if (!session) {
//     console.log(`⏭️ No active session. Ignoring message.`);
//     return;
//   }

//   console.log(`✅ Session found for ${senderPhone}`);

//   // ==================== STEP 3: Handle session commands ====================

//   if (
//     messageType === "text" &&
//     (lowerBody === "submit" ||
//       lowerBody === "confirm" ||
//       lowerBody === "done")
//   ) {
//     console.log(`🚀 SUBMIT command detected`);
//     await handleSubmit(senderPhone, session);
//     return;
//   }

//   if (
//     messageType === "text" &&
//     (lowerBody === "cancel" || lowerBody === "stop")
//   ) {
//     console.log(`❌ CANCEL command detected`);
//     await deleteSession(senderPhone);
//     await sendAutoReply(
//       session.chatId,
//       `❌ SOS cancelled.\n\nType *hi* or *sos* to start again.`
//     );
//     return;
//   }

//   // ==================== STEP 4: Handle media types ====================

//   if (messageType === "location") {
//     console.log(`📍 LOCATION message detected`);
//     await handleLocation(message, session, senderPhone);
//     return;
//   }

//   if (messageType === "image") {
//     console.log(`📸 IMAGE message detected`);
//     await handleImage(message, session, senderPhone);
//     return;
//   }

//   if (messageType === "text") {
//     console.log(
//       `💬 TEXT message detected: "${messageBody.substring(0, 50)}..."`
//     );
//     await handleText(messageBody, session, senderPhone);
//     return;
//   }

//   console.log(`⏭️ Message type not supported: ${messageType}`);
//   await sendAutoReply(
//     session.chatId,
//     `⚠️ Not supported: ${messageType}\n\nPlease send Location, Text, or Image only.`
//   );
// }

// // ================================================================
// //  HANDLER: Trigger (hi / sos)
// // ================================================================
// async function handleTrigger(phone, chatId) {
//   console.log(`   🏗️ Creating/Loading user...`);

//   let user = await User.findOne({ phone });
//   if (!user) {
//     user = new User({
//       name: `WhatsApp User ${phone}`,
//       phone,
//       email: `whatsapp_${phone}@sos.local`,
//       role: "citizen",
//     });
//     await user.save();
//     console.log(`   ✅ User created: ${user._id}`);
//   } else {
//     console.log(`   ✅ User found: ${user._id}`);
//   }

//   const session = {
//     userId: user._id,
//     phone,
//     chatId,
//     incidentData: {
//       type: "Other",
//       severity: "Low",
//       mode: "IMAGE_TEXT",
//       description: "",
//       transcript: "",
//       language: "en",
//       location: { type: "Point", coordinates: [0, 0] },
//       reportedBy: user._id,
//       imageUrl: null,
//       imageBase64: null,
//       audioUrl: null,
//       mediaUploaded: [],
//       whatsappChatId: chatId,
//       forensics: null,
//       aiAnalysis: {
//         vision: { detected: [], confidence: 0, model: "" },
//         voice: { keywords: [], sentiment: "", confidence: 0, model: "" },
//         semantics: { alignment: 0, description: "", model: "" },
//       },
//     },
//     step: "collecting",
//     createdAt: new Date(),
//   };

//   await setSession(phone, session);
//   console.log(`   ✅ Session created`);

//   const welcomeMsg = `🚨 *EMERGENCY SOS SYSTEM* 🚨

// You are now in *SOS Mode*.

// *ALL 3 FIELDS ARE MANDATORY:*

// 1️⃣ 📍 *Share your LOCATION*
//    → Tap 📎 → Location → Send Current Location

// 2️⃣ 💬 *Type a DESCRIPTION*
//    → e.g. "Fire in building near MG Road"

// 3️⃣ 📸 *Send an IMAGE/PHOTO*
//    → Photo/screenshot of the incident
//    → REQUIRED (no text-only reports)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// When you have sent ALL 3, type *SUBMIT*
// To cancel, type *CANCEL*
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ⏰ Session expires in 1 hour.
// 🚀 *Start now!*`;

//   console.log(`   📤 Sending welcome message...`);
//   await sendAutoReply(chatId, welcomeMsg);
//   console.log(`   ✅ Welcome message sent`);
// }

// // ================================================================
// //  HANDLER: Location
// // ================================================================
// async function handleLocation(message, session, phone) {
//   const latitude = message.location?.latitude || 0;
//   const longitude = message.location?.longitude || 0;

//   console.log(`   Processing location: ${latitude}, ${longitude}`);

//   if (!latitude || !longitude) {
//     await sendAutoReply(
//       session.chatId,
//       `❌ Invalid location. Please tap 📎 → Location → Send Current Location.`
//     );
//     return;
//   }

//   session.incidentData.location = {
//     type: "Point",
//     coordinates: [longitude, latitude],
//   };

//   if (!session.incidentData.mediaUploaded.includes("location")) {
//     session.incidentData.mediaUploaded.push("location");
//   }

//   await setSession(phone, session);
//   console.log(`   ✅ Location saved`);

//   await sendAutoReply(
//     session.chatId,
//     `✅ *Location Saved!*\n📍 ${latitude.toFixed(4)}, ${longitude.toFixed(
//       4
//     )}\n\n${buildProgressMessage(session)}`
//   );
// }

// // ================================================================
// //  HANDLER: Text (description)
// // ================================================================
// async function handleText(text, session, phone) {
//   if (!text || text.trim().length === 0) {
//     console.log(`   ⚠️ Empty text`);
//     return;
//   }

//   console.log(`   Processing text: "${text.substring(0, 60)}..."`);

//   session.incidentData.description = text;
//   session.incidentData.transcript = text;

//   const lower = text.toLowerCase();
//   if (lower.includes("fire") || lower.includes("burning")) {
//     session.incidentData.type = "Fire";
//   } else if (lower.includes("flood") || lower.includes("water")) {
//     session.incidentData.type = "Flood";
//   } else if (lower.includes("accident") || lower.includes("crash")) {
//     session.incidentData.type = "Accident";
//   } else if (
//     lower.includes("medical") ||
//     lower.includes("injury") ||
//     lower.includes("blood")
//   ) {
//     session.incidentData.type = "Medical";
//   } else if (lower.includes("building") || lower.includes("collapse")) {
//     session.incidentData.type = "Infrastructure";
//   }

//   if (!session.incidentData.mediaUploaded.includes("text")) {
//     session.incidentData.mediaUploaded.push("text");
//   }

//   await setSession(phone, session);
//   console.log(`   ✅ Text saved, type: ${session.incidentData.type}`);

//   await sendAutoReply(
//     session.chatId,
//     `✅ *Description Saved!*\n\n"_${text}_"\n\n🏷️ Type: *${session.incidentData.type}*\n\n${buildProgressMessage(
//       session
//     )}`
//   );
// }

// // ================================================================
// //  HANDLER: Image with OLLAMA Analysis ✅ COMPLETE FIXED - BASE64
// // ================================================================
// async function handleImage(message, session, phone) {
//   console.log(`   Processing image...`);

//   let imageUrl = message.image?.link || message.image?.url || null;
//   let imageBase64 = null;
//   let imageBuffer = null;

//   // ✅ PRIORITY 1: Try to use link/url from WHAPI
//   if (imageUrl) {
//     console.log(`   ✅ Using image link: ${imageUrl}`);
//   } else if (message.image?.id) {
//     // ✅ PRIORITY 2: Download media ID and convert to base64
//     try {
//       console.log(
//         `   📥 Downloading image from WHAPI: ${message.image.id}`
//       );

//       // ✅ USE THE NEW HELPER FUNCTION
//       const mediaResult = await downloadMediaAsBase64(message.image.id);

//       if (mediaResult) {
//         imageBase64 = mediaResult.base64;
//         imageBuffer = mediaResult.buffer;
//         imageUrl = mediaResult.dataUrl;

//         console.log(`   ✅ Image downloaded & converted to base64`);
//         console.log(`   📊 Size: ${mediaResult.size} bytes`);
//         console.log(
//           `   📝 Base64 length: ${imageBase64.length} characters`
//         );
//         console.log(
//           `   🎯 DataURL: ${imageUrl.substring(0, 50)}...`
//         );
//       } else {
//         throw new Error("Failed to convert media to base64");
//       }
//     } catch (err) {
//       console.log(`   ⚠️ Download failed: ${err.message}`);
//       imageUrl = null;
//       imageBase64 = null;
//       imageBuffer = null;
//     }
//   }

//   if (!imageUrl && !imageBase64) {
//     await sendAutoReply(
//       session.chatId,
//       `❌ Failed to download image. Please try again.`
//     );
//     return;
//   }

//   console.log(`   🔬 Running OLLAMA vision analysis...`);

//   let forensicsResult = {
//     realismFactor: 1.0,
//     isFake: false,
//     confidenceScore: 0,
//     isPocket: false,
//     verdict: "WhatsApp submission",
//     deepfakeIndicators: [],
//     analysis: {},
//   };

//   let visionAnalysis = {
//     detected: [],
//     confidence: 0,
//     model: "WhatsApp",
//   };

//   try {
//     // ✅ USE BASE64 STRING FOR BOTH FORENSICS AND VISION
//     let base64ForAnalysis = imageBase64;

//     // If we only have URL, try to extract base64 from it
//     if (!base64ForAnalysis && imageUrl.includes("base64,")) {
//       base64ForAnalysis = imageUrl.split("base64,")[1];
//       console.log(
//         `   🔄 Extracted base64 from URL: ${base64ForAnalysis.length} chars`
//       );
//     }

//     if (base64ForAnalysis) {
//       console.log(`   🧠 Analyzing with forensics...`);

//       // ✅ Create Buffer from base64 string for forensics
//       const forensicBuffer = Buffer.from(base64ForAnalysis, "base64");

//       forensicsResult = await analyzeForensics(
//         forensicBuffer,
//         "UPLOAD",
//         imageUrl
//       );
//       console.log(`   ✅ Forensics: ${forensicsResult.verdict}`);
//       console.log(
//         `   📊 Realism: ${(forensicsResult.realismFactor * 100).toFixed(
//           1
//         )}%`
//       );

//       console.log(`   👁️ Running vision analysis with base64...`);

//       // ✅ Pass base64 string directly to vision analysis
//       visionAnalysis = await analyzeVision(base64ForAnalysis);
//       console.log(
//         `   ✅ Vision: ${visionAnalysis.confidence}% confidence`
//       );
//       console.log(
//         `   🏷️ Objects detected: ${
//           visionAnalysis.detected.length > 0
//             ? visionAnalysis.detected.join(", ")
//             : "None"
//         }`
//       );
//     } else {
//       console.log(`   ⚠️ No base64 data available for analysis`);
//     }

//     session.incidentData.imageUrl = imageUrl;
//     session.incidentData.imageBase64 = base64ForAnalysis; // ✅ STORE BASE64
//     session.incidentData.forensics = forensicsResult;
//     session.incidentData.aiAnalysis.vision = visionAnalysis;
//   } catch (err) {
//     console.log(`   ⚠️ Analysis error: ${err.message}`);
//     console.log(`   📝 Error details: ${err.stack}`);

//     // ✅ STILL SAVE THE IMAGE EVEN IF ANALYSIS FAILS
//     session.incidentData.imageUrl = imageUrl;
//     session.incidentData.imageBase64 = imageBase64;
//     session.incidentData.forensics = forensicsResult;
//     session.incidentData.aiAnalysis.vision = visionAnalysis;
//   }

//   if (!session.incidentData.mediaUploaded.includes("image")) {
//     session.incidentData.mediaUploaded.push("image");
//   }

//   await setSession(phone, session);
//   console.log(
//     `   ✅ Image stored with base64 (${
//       imageBase64 ? imageBase64.length : 0
//     } chars)`
//   );

//   await sendAutoReply(
//     session.chatId,
//     `✅ *Image Received!*\n📸 Analyzing...\n\n${buildProgressMessage(
//       session
//     )}`
//   );
// }

// // ================================================================
// //  HANDLER: Submit → Create Incident with MANDATORY VALIDATION
// // ================================================================
// async function handleSubmit(phone, session) {
//   console.log(`\n` + "█".repeat(80));
//   console.log(`█ 🚀 SOS SUBMISSION WITH MANDATORY VALIDATION`);
//   console.log(`█`.repeat(80));

//   const { incidentData } = session;
//   const chatId = session.chatId;

//   const hasLocation =
//     incidentData.location.coordinates[0] !== 0 &&
//     incidentData.location.coordinates[1] !== 0;
//   const hasDescription =
//     incidentData.description && incidentData.description.trim().length > 0;
//   const hasImage =
//     incidentData.imageUrl !== null &&
//     incidentData.mediaUploaded.includes("image");

//   console.log(`\n📋 MANDATORY VALIDATION:`);
//   console.log(
//     `   ${hasLocation ? "✅" : "❌"} Location: ${hasLocation ? "OK" : "MISSING"}`
//   );
//   console.log(
//     `   ${hasDescription ? "✅" : "❌"} Description: ${
//       hasDescription ? "OK" : "MISSING"
//     }`
//   );
//   console.log(
//     `   ${hasImage ? "✅" : "❌"} Image: ${hasImage ? "OK" : "MISSING"}`
//   );

//   if (!hasLocation || !hasDescription || !hasImage) {
//     const missing = [];
//     if (!hasLocation) missing.push("📍 Location");
//     if (!hasDescription) missing.push("💬 Description");
//     if (!hasImage) missing.push("📸 Image");

//     const errorMsg = `❌ *SUBMIT BLOCKED - MISSING ${missing.length}/3 REQUIRED FIELDS*

// 🔴 *ALL 3 MANDATORY:*
// ${missing.map((m) => `   ❌ ${m}`).join("\n")}

// ${buildProgressMessage(session)}`;

//     await sendAutoReply(chatId, errorMsg);
//     return;
//   }

//   console.log(`\n👤 User lookup...`);
//   let user = await User.findOne({ phone });
//   if (!user) {
//     user = new User({
//       name: `WhatsApp User ${phone}`,
//       phone,
//       email: `whatsapp_${phone}@sos.local`,
//       role: "citizen",
//     });
//     await user.save();
//   }
//   console.log(`   ✅ User: ${user._id}`);

//   const lat = incidentData.location.coordinates[1];
//   const lon = incidentData.location.coordinates[0];

//   console.log(`\n` + "=".repeat(60));
//   console.log("PHASE 1: TEXT INTELLIGENCE");
//   console.log("=".repeat(60));

//   let textIntelligence = {
//     translatedText: incidentData.description,
//     detectedType: incidentData.type,
//   };

//   try {
//     textIntelligence = await processTextIntelligence(
//       incidentData.description
//     );
//     console.log(`   ✅ Type: ${textIntelligence.detectedType}`);
//   } catch (err) {
//     console.log(`   ⚠️ Skipped: ${err.message}`);
//   }

//   let forensics = incidentData.forensics || {
//     realismFactor: 1.0,
//     isFake: false,
//     confidenceScore: 0,
//     isPocket: false,
//     verdict: "WhatsApp submission",
//     deepfakeIndicators: [],
//   };

//   console.log(`\n` + "=".repeat(60));
//   console.log("PHASE 2: FORENSICS");
//   console.log("=".repeat(60));
//   console.log(`   ✅ Verdict: ${forensics.verdict}`);
//   console.log(`   ✅ Realism: ${(forensics.realismFactor * 100).toFixed(1)}%`);

//   console.log(`\n` + "=".repeat(60));
//   console.log("PHASE 3: AI VISION ANALYSIS");
//   console.log("=".repeat(60));

//   let visionAnalysis = incidentData.aiAnalysis.vision || {
//     detected: [],
//     confidence: 0,
//     model: "WhatsApp",
//   };

//   console.log(`   ✅ Confidence: ${visionAnalysis.confidence}%`);
//   console.log(
//     `   ✅ Objects: ${visionAnalysis.detected.join(", ") || "None"}`
//   );

//   console.log(`\n` + "=".repeat(60));
//   console.log("PHASE 4: SEMANTIC ALIGNMENT");
//   console.log("=".repeat(60));

//   let semantics = incidentData.aiAnalysis.semantics || {
//     alignment: 50,
//     description: "",
//     model: "",
//   };

//   try {
//     if (visionAnalysis.detected && visionAnalysis.detected.length > 0) {
//       semantics = await analyzeSemantics(visionAnalysis, {});
//       console.log(`   ✅ Alignment: ${semantics.alignment}%`);
//     }
//   } catch (err) {
//     console.log(`   ⚠️ Semantic analysis error: ${err.message}`);
//   }

//   console.log(`\n` + "=".repeat(60));
//   console.log("PHASE 5: TRUST SCORING");
//   console.log("=".repeat(60));

//   let trustScoreData = {
//     totalScore: 55,
//     formula: "WHATSAPP_ALL_MEDIA",
//     breakdown: {
//       visual: 0,
//       audio: 0,
//       alignment: 0,
//       consensus: 0,
//     },
//     locationConsensus: { score: 0, nearbyIncidents: 0 },
//   };

//   try {
//     trustScoreData = await calculateTrustScore(
//       "IMAGE_TEXT",
//       forensics,
//       visionAnalysis,
//       {},
//       semantics,
//       lat,
//       lon
//     );
//     console.log(
//       `   ✅ Score: ${trustScoreData.totalScore.toFixed(1)}/100`
//     );
//     console.log(`   ✅ Formula: ${trustScoreData.formula}`);
//   } catch (err) {
//     console.log(`   ⚠️ Trust scoring error: ${err.message}`);
//   }

//   console.log(`\n` + "=".repeat(60));
//   console.log("PHASE 6: PRIORITY CODING");
//   console.log("=".repeat(60));

//   let priorityCode = {
//     code: "ALPHA",
//     description: "Standard incident",
//     dispatchLevel: 2,
//     autoDispatch: false,
//   };

//   try {
//     priorityCode = await determinePriorityCode(
//       trustScoreData,
//       forensics,
//       {},
//       visionAnalysis,
//       trustScoreData.locationConsensus,
//       lat,
//       lon
//     );
//     console.log(`   ✅ Code: ${priorityCode.code}`);
//     console.log(`   ✅ Level: ${priorityCode.dispatchLevel}`);
//   } catch (err) {
//     console.log(`   ⚠️ Priority coding error: ${err.message}`);
//   }

//   console.log(`\n` + "=".repeat(60));
//   console.log("DETERMINING SEVERITY");
//   console.log("=".repeat(60));

//   const desc = incidentData.description.toLowerCase();
//   let severity = "Low";

//   const criticalWords = ["dying", "dead", "trapped", "collapse", "explosion"];
//   const highWords = [
//     "fire",
//     "blood",
//     "injury",
//     "crash",
//     "burning",
//     "flood",
//   ];
//   const mediumWords = ["help", "emergency", "hurt", "broken"];

//   if (criticalWords.some((w) => desc.includes(w))) severity = "Critical";
//   else if (highWords.some((w) => desc.includes(w))) severity = "High";
//   else if (mediumWords.some((w) => desc.includes(w))) severity = "Medium";

//   console.log(`   🔴 Final Severity: ${severity}`);
//   console.log(`   📊 Trust Score: ${trustScoreData.totalScore.toFixed(1)}`);
//   console.log(`   🏷️ Priority: ${priorityCode.code}`);

//   console.log(`\n` + "=".repeat(60));
//   console.log("CREATING INCIDENT IN DATABASE");
//   console.log("=".repeat(60));

//   // ✅ STORE WHATSAPP CHATID, PHONE, AND BASE64 IN INCIDENT
//   const incident = new Incident({
//     type: textIntelligence.detectedType || incidentData.type || "Other",
//     description: incidentData.description,
//     severity,
//     mode: "IMAGE_TEXT",
//     transcript: incidentData.transcript || undefined,
//     language: "en",
//     imageUrl: incidentData.imageUrl || null,
//     imageBase64: incidentData.imageBase64 || null, // ✅ STORE BASE64
//     location: {
//       type: "Point",
//       coordinates: [lon, lat],
//     },
//     reportedBy: user._id,
//     status: forensics.isFake ? "Spam" : "Pending",
//     forensics,
//     aiAnalysis: {
//       vision: visionAnalysis,
//       voice: {
//         keywords: [],
//         sentiment: "neutral",
//         confidence: 0,
//         model: "WhatsApp",
//       },
//       semantics,
//     },
//     trustScore: trustScoreData,
//     priorityCode,
//     // ✅ STORE WHATSAPP INFO
//     whatsappChatId: chatId,
//     whatsappPhone: phone,
//     verificationLog: [
//       {
//         phase: "whatsapp_sos_submission",
//         timestamp: new Date(),
//         result: {
//           phone,
//           chatId,
//           mediaUploaded: incidentData.mediaUploaded,
//           trustScore: trustScoreData.totalScore,
//           severity,
//           hasLocation: true,
//           hasText: true,
//           hasImage: true,
//           base64Length: incidentData.imageBase64
//             ? incidentData.imageBase64.length
//             : 0,
//         },
//       },
//     ],
//   });

//   await incident.save();
//   await incident.populate("reportedBy", "name email phone role");

//   console.log(`   ✅ Incident: ${incident._id}`);
//   console.log(`   ✅ WhatsApp ChatId: ${chatId}`);
//   console.log(`   ✅ Base64 Image: ${incidentData.imageBase64 ? incidentData.imageBase64.length + " chars" : "Not stored"}`);
//   console.log(`   📏 Score: ${trustScoreData.totalScore.toFixed(1)}`);

//   const refId = incident._id.toString().slice(-6).toUpperCase();

//   const confirmMsg = `✅ *SOS REPORT SUBMITTED!*

// 🆔 *Reference:* #${refId}

// 📋 *Report Summary:*
//    📍 Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}
//    💬 Description: ${incidentData.description.substring(0, 60)}...
//    🏷️ Type: *${incident.type}*
//    🚨 Severity: *${severity}*
//    🔴 Priority: *${priorityCode.code}*
//    📊 Score: *${trustScoreData.totalScore.toFixed(1)}/100*
//    📸 Media: Location ✅ Text ✅ Image ✅

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🏥 *Next Steps:*
//    1️⃣ Agency reviews (2-5 min)
//    2️⃣ Resources allocated
//    3️⃣ Help dispatched
//    4️⃣ Live updates here

// 🔔 *DO NOT CLOSE THIS CHAT*

// ${
//   priorityCode.autoDispatch
//     ? "⚡ *AUTO-DISPATCH* — Help is on the way!\n"
//     : ""
// }

// Thank you! Stay safe! 🙏`;

//   const confirmSent = await sendAutoReply(chatId, confirmMsg);
//   if (confirmSent) {
//     console.log(`   ✅ Confirmation sent`);
//   } else {
//     console.log(`   ⚠️ Confirmation send failed`);
//   }

//   await deleteSession(phone);
//   console.log(`   🧹 Session cleared`);

//   console.log("█".repeat(80) + "\n");
// }

// // ================================================================
// //  API: Get SOS Status (for citizen tracking)
// // ================================================================
// export const getSOSStatus = async (req, res) => {
//   try {
//     const { incidentId } = req.params;
//     const incident = await Incident.findById(incidentId)
//       .populate("reportedBy", "name email phone")
//       .populate("respondedBy", "name email phone")
//       .populate({
//         path: "dispatchedResources",
//         select: "item_name category quantity status location",
//       });

//     if (!incident) return res.status(404).json({ error: "Not found" });

//     return res.status(200).json({
//       success: true,
//       incident: {
//         id: incident._id,
//         referenceNumber: incident._id
//           .toString()
//           .slice(-6)
//           .toUpperCase(),
//         status: incident.status,
//         severity: incident.severity,
//         type: incident.type,
//         description: incident.description,
//         imageUrl: incident.imageUrl,
//         location: {
//           latitude: incident.location.coordinates[1],
//           longitude: incident.location.coordinates[0],
//         },
//         reportedAt: incident.createdAt,
//         reportedBy: incident.reportedBy,
//         respondedBy: incident.respondedBy || null,
//         acceptedAt: incident.acceptedAt || null,
//         dispatchedAt: incident.dispatchedAt || null,
//         dispatchedResources: incident.dispatchedResources || [],
//         trustScore: incident.trustScore?.totalScore,
//         priority: incident.priorityCode?.code,
//       },
//       timeline: [
//         { event: "SOS Created", timestamp: incident.createdAt, done: true },
//         {
//           event: "Agency Accepted",
//           timestamp: incident.acceptedAt,
//           done: incident.acceptedAt !== null,
//         },
//         {
//           event: "Resources Dispatched",
//           timestamp: incident.dispatchedAt,
//           done: incident.dispatchedAt !== null,
//         },
//       ],
//     });
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================================================
// //  API: Agency Accept Incident + SEND WHATSAPP UPDATE ✅
// // ================================================================
// export const agencyAcceptIncident = async (req, res) => {
//   try {
//     const { incidentId } = req.params;
//     const { agencyId, agencyName } = req.body;

//     console.log(`\n` + "█".repeat(80));
//     console.log(`█ 🏢 AGENCY ACCEPTING SOS + WHATSAPP NOTIFICATION`);
//     console.log(`█`.repeat(80));

//     const incident = await Incident.findById(incidentId).populate(
//       "reportedBy",
//       "name email phone"
//     );

//     if (!incident)
//       return res.status(404).json({ error: "Incident not found" });

//     if (incident.status !== "Pending") {
//       return res.status(400).json({
//         error: `Cannot accept: status is ${incident.status}`,
//       });
//     }

//     // ✅ UPDATE INCIDENT STATUS
//     incident.status = "Active";
//     incident.respondedBy = agencyId;
//     incident.acceptedAt = new Date();
//     incident.verificationLog.push({
//       phase: "agency_acceptance",
//       timestamp: new Date(),
//       result: { agencyId, agencyName, status: "Active" },
//     });
//     await incident.save();

//     console.log(`   ✅ Accepted by: ${agencyName} (${agencyId})`);
//     console.log(`   🆔 Incident: ${incidentId}`);
//     console.log(`   🏷️ Type: ${incident.type}`);
//     console.log(`   🚨 Severity: ${incident.severity}`);

//     // ==================== SEND WHATSAPP UPDATE TO CITIZEN ✅ ====================
//     console.log(`\n   📤 SENDING WHATSAPP TO CITIZEN...`);

//     let sendSuccess = false;

//     try {
//       // ✅ GET WHATSAPP CHATID FROM INCIDENT
//       const chatId = incident.whatsappChatId;

//       if (!chatId) {
//         throw new Error("No WhatsApp ChatId stored in incident");
//       }

//       const refId = incident._id.toString().slice(-6).toUpperCase();
//       const lat = incident.location.coordinates[1];
//       const lon = incident.location.coordinates[0];

//       const acceptMsg = `✅ *SOS VERIFIED & ACCEPTED*

// 🏢 *Agency:* ${agencyName}
// 📋 *Reference:* #${refId}

// 🏷️ *Incident Type:* ${incident.type}
// 🚨 *Severity:* ${incident.severity}
// 💬 *Description:* ${incident.description.substring(0, 60)}...

// 📍 *Your Location:*
// ${lat.toFixed(4)}, ${lon.toFixed(4)}

// 🗺️ *View Map:* https://maps.google.com/?q=${lat},${lon}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🚑 *Resources being prepared...*
//    ⏳ Estimated dispatch: 5-10 minutes
//    📱 You'll be notified when help leaves the station

// 🆘 *Stay calm & stay safe!*

// 🔔 *KEEP THIS CHAT OPEN FOR UPDATES*`;

//       console.log(`   → ChatId: ${chatId}`);
//       console.log(`   → Message size: ${acceptMsg.length} chars`);

//       // ✅ CALL WHAPI AND CHECK RETURN VALUE
//       sendSuccess = await sendAutoReply(chatId, acceptMsg);

//       if (sendSuccess) {
//         console.log(
//           `   ✅ ✅ ✅ WHATSAPP SENT SUCCESSFULLY! ✅ ✅ ✅`
//         );
//       } else {
//         console.log(`   ❌ ❌ ❌ WHATSAPP SEND FAILED! ❌ ❌ ❌`);
//       }
//     } catch (err) {
//       console.log(`   ❌ ERROR: ${err.message}`);
//       sendSuccess = false;
//     }

//     console.log("█".repeat(80) + "\n");

//     return res.status(200).json({
//       success: true,
//       message: `SOS accepted${
//         sendSuccess
//           ? " ✅ Citizen notified via WhatsApp"
//           : " ⚠️ WhatsApp notification failed"
//       }`,
//       whatsappSent: sendSuccess,
//       incident: {
//         id: incident._id,
//         status: incident.status,
//         acceptedAt: incident.acceptedAt,
//         respondedBy: incident.respondedBy,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================================================
// //  API: Coordinator Dispatch Resources + SEND WHATSAPP UPDATES ✅
// // ================================================================
// export const coordinatorDispatchResources = async (req, res) => {
//   try {
//     const { incidentId } = req.params;
//     const { resourceIds, coordinatorId, coordinatorName } = req.body;

//     console.log(`\n` + "█".repeat(80));
//     console.log(`█ 🚑 DISPATCHING RESOURCES + WHATSAPP NOTIFICATIONS`);
//     console.log(`█`.repeat(80));

//     const incident = await Incident.findById(incidentId).populate(
//       "reportedBy",
//       "name email phone"
//     );

//     if (!incident)
//       return res.status(404).json({ error: "Incident not found" });

//     if (incident.status !== "Active") {
//       return res.status(400).json({
//         error: `Cannot dispatch: status is ${incident.status}. Must be Active.`,
//       });
//     }

//     // ✅ GET RESOURCES FROM DATABASE
//     console.log(`   🔍 Fetching ${resourceIds.length} resources...`);
//     const resources = await Resource.find({ _id: { $in: resourceIds } });

//     if (resources.length === 0) {
//       return res.status(400).json({
//         error: `No resources found for IDs: ${resourceIds.join(", ")}`,
//       });
//     }

//     console.log(`   ✅ Found ${resources.length} resources`);

//     // ✅ UPDATE INCIDENT
//     incident.status = "Resolved";
//     incident.dispatchedResources = resourceIds;
//     incident.dispatchedAt = new Date();
//     incident.verificationLog.push({
//       phase: "resource_dispatch",
//       timestamp: new Date(),
//       result: {
//         coordinatorId,
//         coordinatorName,
//         resourcesDispatched: resourceIds.length,
//         resources: resources.map((r) => ({
//           name: r.item_name,
//           quantity: r.quantity,
//           category: r.category,
//           status: r.status,
//         })),
//       },
//     });
//     await incident.save();

//     console.log(`   ✅ Incident status: Resolved`);

//     // ✅ UPDATE RESOURCE STATUS TO DEPLOYED
//     await Resource.updateMany(
//       { _id: { $in: resourceIds } },
//       {
//         status: "Deployed",
//         current_incident: incidentId,
//       }
//     );

//     console.log(`   ✅ Resources updated to Deployed`);

//     // ==================== SEND WHATSAPP UPDATES TO CITIZEN ✅ ====================
//     console.log(`\n   📤 SENDING WHATSAPP MESSAGES TO CITIZEN...`);

//     let messagesSent = 0;
//     let errors = [];

//     try {
//       // ✅ GET WHATSAPP CHATID FROM INCIDENT
//       const chatId = incident.whatsappChatId;

//       if (!chatId) {
//         throw new Error("No WhatsApp ChatId stored in incident");
//       }

//       const refId = incident._id.toString().slice(-6).toUpperCase();
//       const lat = incident.location.coordinates[1];
//       const lon = incident.location.coordinates[0];

//       // Build resource list for main message
//       const resourceList = resources
//         .map(
//           (r, i) =>
//             `${i + 1}. 🚑 ${r.quantity}x *${r.item_name}*\n   Category: ${r.category}\n   Status: ${r.status}`
//         )
//         .join("\n\n");

//       // ✅ MAIN DISPATCH MESSAGE
//       const dispatchMsg = `🚀 *HELP IS ON THE WAY!* 🚀

// ✅ Emergency units DISPATCHED to your location.

// 📋 *Reference:* #${refId}
// 🏷️ *Type:* ${incident.type}
// 🚨 *Severity:* ${incident.severity}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📦 *DISPATCHED RESOURCES:*

// ${resourceList}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📍 *Your Location:*
// ${lat.toFixed(4)}, ${lon.toFixed(4)}

// 🗺️ *View Map:* https://maps.google.com/?q=${lat},${lon}

// ⏱️ *ETA: 5-10 minutes*

// 🟢 *Status: UNDERWAY*

// 🔔 *LIVE UPDATES IN THIS CHAT*

// 🙏 *Stay calm. Help is coming!*`;

//       console.log(
//         `\n   📤 [1/MAIN] Sending main dispatch message...`
//       );
//       const mainResult = await sendAutoReply(chatId, dispatchMsg);

//       if (mainResult) {
//         console.log(`   ✅ Main message sent!`);
//         messagesSent++;
//       } else {
//         console.log(`   ❌ Main message FAILED`);
//         errors.push("Main dispatch message failed");
//       }

//       // ✅ SEND INDIVIDUAL RESOURCE UPDATES
//       console.log(`\n   📤 Sending individual resource updates...`);

//       for (let i = 0; i < resources.length; i++) {
//         const resource = resources[i];

//         try {
//           // Delay between messages
//           if (i > 0) {
//             await new Promise((resolve) =>
//               setTimeout(resolve, 1500)
//             );
//           }

//           const followUpMsg = `📍 *${resource.item_name.toUpperCase()}*

// 🆔 *Unit #${i + 1} arriving soon*

// ⏱️ ETA: 5-10 minutes
// Quantity: ${resource.quantity}
// Category: ${resource.category}

// 🟢 *Status: IN TRANSIT*

// 🗺️ Track location: https://maps.google.com/?q=${lat},${lon}

// 🔔 You'll be notified when unit arrives`;

//           console.log(
//             `   📤 [${i + 2}/${
//               resources.length + 1
//             }] ${resource.item_name}...`
//           );
//           const resResult = await sendAutoReply(
//             chatId,
//             followUpMsg
//           );

//           if (resResult) {
//             console.log(
//               `   ✅ Resource message sent: ${resource.item_name}`
//             );
//             messagesSent++;
//           } else {
//             console.log(
//               `   ❌ Resource message FAILED: ${resource.item_name}`
//             );
//             errors.push(
//               `Resource update failed: ${resource.item_name}`
//             );
//           }
//         } catch (err) {
//           console.log(`   ❌ Error: ${err.message}`);
//           errors.push(
//             `Exception for ${resource.item_name}: ${err.message}`
//           );
//         }
//       }
//     } catch (err) {
//       console.log(`   ❌ WHATSAPP ERROR: ${err.message}`);
//       errors.push(err.message);
//     }

//     console.log(
//       `\n   📊 SUMMARY: ${messagesSent}/${resources.length + 1} messages sent`
//     );
//     console.log("█".repeat(80) + "\n");

//     return res.status(200).json({
//       success: true,
//       message: `Resources dispatched - ${messagesSent}/${
//         resources.length + 1
//       } WhatsApp messages sent`,
//       whatsappStatus: {
//         messagesSent,
//         totalExpected: resources.length + 1,
//         errors: errors.length > 0 ? errors : null,
//       },
//       incident: {
//         id: incident._id,
//         status: incident.status,
//         dispatchedAt: incident.dispatchedAt,
//         resourcesCount: resources.length,
//         location: {
//           latitude: incident.location.coordinates[1],
//           longitude: incident.location.coordinates[0],
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================================================
// //  API: Get Dispatched Resources for Incident (For Agency Display)
// // ================================================================
// export const getDispatchedResources = async (req, res) => {
//   try {
//     const { incidentId } = req.params;

//     const incident = await Incident.findById(incidentId).populate({
//       path: "dispatchedResources",
//       select:
//         "item_name category quantity status location baseLocation destinationLocation dispatchedAt owner",
//       populate: {
//         path: "owner",
//         select: "name email phone role",
//       },
//     });

//     if (!incident)
//       return res.status(404).json({ error: "Incident not found" });

//     return res.status(200).json({
//       success: true,
//       incident: {
//         id: incident._id,
//         type: incident.type,
//         severity: incident.severity,
//         status: incident.status,
//         dispatchedAt: incident.dispatchedAt,
//         location: {
//           latitude: incident.location.coordinates[1],
//           longitude: incident.location.coordinates[0],
//         },
//       },
//       resources: incident.dispatchedResources || [],
//       metadata: {
//         totalDispatched: incident.dispatchedResources?.length || 0,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================================================
// //  API: Get Pending Incidents (for Agency Dashboard)
// // ================================================================
// export const getPendingIncidents = async (req, res) => {
//   try {
//     const incidents = await Incident.find({ status: "Pending" })
//       .populate("reportedBy", "name email phone role")
//       .sort({ createdAt: -1 })
//       .limit(50);

//     return res.status(200).json({
//       success: true,
//       count: incidents.length,
//       incidents: incidents.map((inc) => ({
//         id: inc._id,
//         referenceNumber: inc._id
//           .toString()
//           .slice(-6)
//           .toUpperCase(),
//         type: inc.type,
//         severity: inc.severity,
//         description: inc.description,
//         imageUrl: inc.imageUrl,
//         location: {
//           latitude: inc.location.coordinates[1],
//           longitude: inc.location.coordinates[0],
//         },
//         reportedBy: inc.reportedBy,
//         trustScore: inc.trustScore?.totalScore,
//         priority: inc.priorityCode?.code,
//         createdAt: inc.createdAt,
//       })),
//     });
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ================================================================
// //  API: Get Active Incidents (for Coordinator Dashboard)
// // ================================================================
// export const getActiveIncidents = async (req, res) => {
//   try {
//     const incidents = await Incident.find({ status: "Active" })
//       .populate("reportedBy", "name email phone")
//       .populate("respondedBy", "name email")
//       .populate({
//         path: "dispatchedResources",
//         select: "item_name category quantity status",
//       })
//       .sort({ acceptedAt: -1 })
//       .limit(50);

//     return res.status(200).json({
//       success: true,
//       count: incidents.length,
//       incidents,
//     });
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     return res.status(500).json({ error: error.message });
//   }
// };

// // ✅ DEFAULT EXPORT ONLY
// export default {
//   handleIncomingWhatsAppMessage,
//   getSOSStatus,
//   agencyAcceptIncident,
//   coordinatorDispatchResources,
//   getDispatchedResources,
//   getPendingIncidents,
//   getActiveIncidents,
// };
import Incident from "../models/incident.model.js";
import User from "../models/user.models.js";
import Resource from "../models/resource.model.js";
import { 
  sendAutoReply, 
  downloadMediaFromWhapi,
  downloadMediaAsBase64 
} from "../utils/whapi.js";
import {
  getSession,
  setSession,
  deleteSession,
} from "../utils/session-manager.js";
import {
  analyzeVision,
  analyzeSemantics,
  processTextIntelligence,
} from "../utils/ai-analysis.js";
import { calculateTrustScore } from "../utils/scoring.js";
import { determinePriorityCode } from "../utils/priority-coding.js";
import forensicsModule from "../utils/forensics.js";

const { analyzeForensics } = forensicsModule;

// ==================== HELPERS ====================
const extractPhoneFromChatId = (chatId) => {
  const match = chatId.match(/(\d{10,15})@/);
  return match ? match[1] : null;
};

const formatPhoneToChatId = (phone) => {
  const cleanPhone = phone.replace(/\D/g, "");
  return `${cleanPhone}@s.whatsapp.net`;
};

const processedMessageIds = new Set();

function trackMessage(id) {
  if (processedMessageIds.has(id)) return false;
  processedMessageIds.add(id);
  if (processedMessageIds.size > 500) {
    const first = processedMessageIds.values().next().value;
    if (first) processedMessageIds.delete(first);
  }
  return true;
}

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
    msg += `🟢 *Ready to submit!*\nType *SUBMIT* to create your SOS report.`;
  } else {
    const needed = [];
    if (!hasLoc) needed.push("📍 Location");
    if (!hasText) needed.push("💬 Description");
    if (!hasImg) needed.push("📸 Image");
    msg += `🔴 *STILL NEED:* ${needed.join(" + ")}`;
  }
  return msg;
};

// ================================================================
//  MAIN WEBHOOK — Only responds to "hi"/"sos" or active sessions
// ================================================================
export const handleIncomingWhatsAppMessage = async (req, res) => {
  console.log("\n" + "█".repeat(80));
  console.log("█ 📨 WHATSAPP WEBHOOK RECEIVED");
  console.log("█".repeat(80));

  try {
    res.status(200).json({
      success: true,
      message: "Webhook received",
    });

    const { messages } = req.body;

    if (!messages || messages.length === 0) {
      console.log("⚠️ No messages in webhook");
      return;
    }

    console.log(`\n📨 Received ${messages.length} message(s)`);

    for (const message of messages) {
      try {
        await processMessage(message);
      } catch (err) {
        console.error(
          `❌ Error processing message ${message.id}:`,
          err.message
        );
      }
    }
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.message, error.stack);
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        message: "Webhook received (error processing)",
      });
    }
  }

  console.log("█".repeat(80) + "\n");
};

// ================================================================
//  PROCESS MESSAGE - ONLY TRIGGER ON "hi"/"sos" OR ACTIVE SESSION
// ================================================================
async function processMessage(message) {
  // Skip our own outgoing messages
  if (message.from_me) {
    console.log("⏭️ Skipping: Message sent by us");
    return;
  }

  // Dedupe
  if (message.id && !trackMessage(message.id)) {
    console.log(`⏭️ Skipping: Duplicate message ID ${message.id}`);
    return;
  }

  const senderChatId = message.chat_id || message.from;
  if (!senderChatId) {
    console.log("❌ No chat ID found");
    return;
  }

  const senderPhone = extractPhoneFromChatId(senderChatId);
  if (!senderPhone) {
    console.log("❌ Could not extract phone from:", senderChatId);
    return;
  }

  const messageType = message.type;
  const messageBody = (message.text?.body || "").trim();
  const lowerBody = messageBody.toLowerCase();

  console.log(
    `\n📱 [${senderPhone}] type=${messageType} body="${messageBody
      .substring(0, 50)
      .trim()}..."`
  );

  // ==================== STEP 1: Check for TRIGGER "hi" or "sos" ====================
  if (
    messageType === "text" &&
    (lowerBody === "hi" || lowerBody === "sos")
  ) {
    console.log(`🔥 TRIGGER DETECTED: "${lowerBody}"`);
    await handleTrigger(senderPhone, senderChatId);
    return;
  }

  // ==================== STEP 2: Check for active session ====================
  const session = await getSession(senderPhone);

  if (!session) {
    console.log(`⏭️ No active session. Ignoring message.`);
    return;
  }

  console.log(`✅ Session found for ${senderPhone}`);

  // ==================== STEP 3: Handle session commands ====================

  if (
    messageType === "text" &&
    (lowerBody === "submit" ||
      lowerBody === "confirm" ||
      lowerBody === "done")
  ) {
    console.log(`🚀 SUBMIT command detected`);
    await handleSubmit(senderPhone, session);
    return;
  }

  if (
    messageType === "text" &&
    (lowerBody === "cancel" || lowerBody === "stop")
  ) {
    console.log(`❌ CANCEL command detected`);
    await deleteSession(senderPhone);
    await sendAutoReply(
      session.chatId,
      `❌ SOS cancelled.\n\nType *hi* or *sos* to start again.`
    );
    return;
  }

  // ==================== STEP 4: Handle media types ====================

  if (messageType === "location") {
    console.log(`📍 LOCATION message detected`);
    await handleLocation(message, session, senderPhone);
    return;
  }

  if (messageType === "image") {
    console.log(`📸 IMAGE message detected`);
    await handleImage(message, session, senderPhone);
    return;
  }

  if (messageType === "text") {
    console.log(
      `💬 TEXT message detected: "${messageBody.substring(0, 50)}..."`
    );
    await handleText(messageBody, session, senderPhone);
    return;
  }

  console.log(`⏭️ Message type not supported: ${messageType}`);
  await sendAutoReply(
    session.chatId,
    `⚠️ Not supported: ${messageType}\n\nPlease send Location, Text, or Image only.`
  );
}

// ================================================================
//  HANDLER: Trigger (hi / sos)
// ================================================================
async function handleTrigger(phone, chatId) {
  console.log(`   🏗️ Creating/Loading user...`);

  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({
      name: `WhatsApp User ${phone}`,
      phone,
      email: `whatsapp_${phone}@sos.local`,
      role: "citizen",
    });
    await user.save();
    console.log(`   ✅ User created: ${user._id}`);
  } else {
    console.log(`   ✅ User found: ${user._id}`);
  }

  const session = {
    userId: user._id,
    phone,
    chatId,
    incidentData: {
      type: "Other",
      severity: "Low",
      mode: "IMAGE_TEXT",
      description: "",
      transcript: "",
      language: "en",
      location: { type: "Point", coordinates: [0, 0] },
      reportedBy: user._id,
      imageUrl: null,
      imageBase64: null,
      audioUrl: null,
      mediaUploaded: [],
      whatsappChatId: chatId,
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

  await setSession(phone, session);
  console.log(`   ✅ Session created`);

  const welcomeMsg = `🚨 *EMERGENCY SOS SYSTEM* 🚨

You are now in *SOS Mode*.

*ALL 3 FIELDS ARE MANDATORY:*

1️⃣ 📍 *Share your LOCATION*
   → Tap 📎 → Location → Send Current Location

2️⃣ 💬 *Type a DESCRIPTION*
   → e.g. "Fire in building near MG Road"

3️⃣ 📸 *Send an IMAGE/PHOTO*
   → Photo/screenshot of the incident
   → REQUIRED (no text-only reports)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
When you have sent ALL 3, type *SUBMIT*
To cancel, type *CANCEL*
━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Session expires in 1 hour.
🚀 *Start now!*`;

  console.log(`   📤 Sending welcome message...`);
  await sendAutoReply(chatId, welcomeMsg);
  console.log(`   ✅ Welcome message sent`);
}

// ================================================================
//  HANDLER: Location
// ================================================================
async function handleLocation(message, session, phone) {
  const latitude = message.location?.latitude || 0;
  const longitude = message.location?.longitude || 0;

  console.log(`   Processing location: ${latitude}, ${longitude}`);

  if (!latitude || !longitude) {
    await sendAutoReply(
      session.chatId,
      `❌ Invalid location. Please tap 📎 → Location → Send Current Location.`
    );
    return;
  }

  session.incidentData.location = {
    type: "Point",
    coordinates: [longitude, latitude],
  };

  if (!session.incidentData.mediaUploaded.includes("location")) {
    session.incidentData.mediaUploaded.push("location");
  }

  await setSession(phone, session);
  console.log(`   ✅ Location saved`);

  await sendAutoReply(
    session.chatId,
    `✅ *Location Saved!*\n📍 ${latitude.toFixed(4)}, ${longitude.toFixed(
      4
    )}\n\n${buildProgressMessage(session)}`
  );
}

// ================================================================
//  HANDLER: Text (description)
// ================================================================
async function handleText(text, session, phone) {
  if (!text || text.trim().length === 0) {
    console.log(`   ⚠️ Empty text`);
    return;
  }

  console.log(`   Processing text: "${text.substring(0, 60)}..."`);

  session.incidentData.description = text;
  session.incidentData.transcript = text;

  const lower = text.toLowerCase();
  if (lower.includes("fire") || lower.includes("burning")) {
    session.incidentData.type = "Fire";
  } else if (lower.includes("flood") || lower.includes("water")) {
    session.incidentData.type = "Flood";
  } else if (lower.includes("accident") || lower.includes("crash")) {
    session.incidentData.type = "Accident";
  } else if (
    lower.includes("medical") ||
    lower.includes("injury") ||
    lower.includes("blood")
  ) {
    session.incidentData.type = "Medical";
  } else if (lower.includes("building") || lower.includes("collapse")) {
    session.incidentData.type = "Infrastructure";
  }

  if (!session.incidentData.mediaUploaded.includes("text")) {
    session.incidentData.mediaUploaded.push("text");
  }

  await setSession(phone, session);
  console.log(`   ✅ Text saved, type: ${session.incidentData.type}`);

  await sendAutoReply(
    session.chatId,
    `✅ *Description Saved!*\n\n"_${text}_"\n\n🏷️ Type: *${session.incidentData.type}*\n\n${buildProgressMessage(
      session
    )}`
  );
}

// ================================================================
//  HANDLER: Image with OLLAMA Analysis ✅ COMPLETE FIXED - BASE64
// ================================================================
async function handleImage(message, session, phone) {
  console.log(`   Processing image...`);

  let imageUrl = message.image?.link || message.image?.url || null;
  let imageBase64 = null;
  let imageBuffer = null;

  // ✅ PRIORITY 1: Try to use link/url from WHAPI
  if (imageUrl) {
    console.log(`   ✅ Using image link: ${imageUrl}`);
  } else if (message.image?.id) {
    // ✅ PRIORITY 2: Download media ID and convert to base64
    try {
      console.log(
        `   📥 Downloading image from WHAPI: ${message.image.id}`
      );

      // ✅ USE THE NEW HELPER FUNCTION
      const mediaResult = await downloadMediaAsBase64(message.image.id);

      if (mediaResult) {
        imageBase64 = mediaResult.base64;
        imageBuffer = mediaResult.buffer;
        imageUrl = mediaResult.dataUrl;

        console.log(`   ✅ Image downloaded & converted to base64`);
        console.log(`   📊 Size: ${mediaResult.size} bytes`);
        console.log(
          `   📝 Base64 length: ${imageBase64.length} characters`
        );
        console.log(
          `   🎯 DataURL: ${imageUrl.substring(0, 50)}...`
        );
      } else {
        throw new Error("Failed to convert media to base64");
      }
    } catch (err) {
      console.log(`   ⚠️ Download failed: ${err.message}`);
      imageUrl = null;
      imageBase64 = null;
      imageBuffer = null;
    }
  }

  if (!imageUrl && !imageBase64) {
    await sendAutoReply(
      session.chatId,
      `❌ Failed to download image. Please try again.`
    );
    return;
  }

  console.log(`   🔬 Running OLLAMA vision analysis...`);

  let forensicsResult = {
    realismFactor: 1.0,
    isFake: false,
    confidenceScore: 0,
    isPocket: false,
    verdict: "WhatsApp submission",
    deepfakeIndicators: [],
    analysis: {},
  };

  let visionAnalysis = {
    detected: [],
    confidence: 0,
    model: "WhatsApp",
  };

  try {
    // ✅ USE BASE64 STRING FOR BOTH FORENSICS AND VISION
    let base64ForAnalysis = imageBase64;

    // If we only have URL, try to extract base64 from it
    if (!base64ForAnalysis && imageUrl.includes("base64,")) {
      base64ForAnalysis = imageUrl.split("base64,")[1];
      console.log(
        `   🔄 Extracted base64 from URL: ${base64ForAnalysis.length} chars`
      );
    }

    if (base64ForAnalysis) {
      console.log(`   🧠 Analyzing with forensics...`);

      // ✅ Create Buffer from base64 string for forensics
      const forensicBuffer = Buffer.from(base64ForAnalysis, "base64");

      forensicsResult = await analyzeForensics(
        forensicBuffer,
        "UPLOAD",
        imageUrl
      );
      console.log(`   ✅ Forensics: ${forensicsResult.verdict}`);
      console.log(
        `   📊 Realism: ${(forensicsResult.realismFactor * 100).toFixed(
          1
        )}%`
      );

      console.log(`   👁️ Running vision analysis with base64...`);

      // ✅ Pass base64 string directly to vision analysis
      visionAnalysis = await analyzeVision(base64ForAnalysis);
      console.log(
        `   ✅ Vision: ${visionAnalysis.confidence}% confidence`
      );
      console.log(
        `   🏷️ Objects detected: ${
          visionAnalysis.detected.length > 0
            ? visionAnalysis.detected.join(", ")
            : "None"
        }`
      );
    } else {
      console.log(`   ⚠️ No base64 data available for analysis`);
    }

    session.incidentData.imageUrl = imageUrl;
    session.incidentData.imageBase64 = base64ForAnalysis; // ✅ STORE BASE64
    session.incidentData.forensics = forensicsResult;
    session.incidentData.aiAnalysis.vision = visionAnalysis;
  } catch (err) {
    console.log(`   ⚠️ Analysis error: ${err.message}`);
    console.log(`   📝 Error details: ${err.stack}`);

    // ✅ STILL SAVE THE IMAGE EVEN IF ANALYSIS FAILS
    session.incidentData.imageUrl = imageUrl;
    session.incidentData.imageBase64 = imageBase64;
    session.incidentData.forensics = forensicsResult;
    session.incidentData.aiAnalysis.vision = visionAnalysis;
  }

  if (!session.incidentData.mediaUploaded.includes("image")) {
    session.incidentData.mediaUploaded.push("image");
  }

  await setSession(phone, session);
  console.log(
    `   ✅ Image stored with base64 (${
      imageBase64 ? imageBase64.length : 0
    } chars)`
  );

  await sendAutoReply(
    session.chatId,
    `✅ *Image Received!*\n📸 Analyzing...\n\n${buildProgressMessage(
      session
    )}`
  );
}

// ================================================================
//  HANDLER: Submit → Create Incident with MANDATORY VALIDATION
// ================================================================
async function handleSubmit(phone, session) {
  console.log(`\n` + "█".repeat(80));
  console.log(`█ 🚀 SOS SUBMISSION WITH MANDATORY VALIDATION`);
  console.log(`█`.repeat(80));

  const { incidentData } = session;
  const chatId = session.chatId;

  const hasLocation =
    incidentData.location.coordinates[0] !== 0 &&
    incidentData.location.coordinates[1] !== 0;
  const hasDescription =
    incidentData.description && incidentData.description.trim().length > 0;
  const hasImage =
    incidentData.imageUrl !== null &&
    incidentData.mediaUploaded.includes("image");

  console.log(`\n📋 MANDATORY VALIDATION:`);
  console.log(
    `   ${hasLocation ? "✅" : "❌"} Location: ${hasLocation ? "OK" : "MISSING"}`
  );
  console.log(
    `   ${hasDescription ? "✅" : "❌"} Description: ${
      hasDescription ? "OK" : "MISSING"
    }`
  );
  console.log(
    `   ${hasImage ? "✅" : "❌"} Image: ${hasImage ? "OK" : "MISSING"}`
  );

  if (!hasLocation || !hasDescription || !hasImage) {
    const missing = [];
    if (!hasLocation) missing.push("📍 Location");
    if (!hasDescription) missing.push("💬 Description");
    if (!hasImage) missing.push("📸 Image");

    const errorMsg = `❌ *SUBMIT BLOCKED - MISSING ${missing.length}/3 REQUIRED FIELDS*

🔴 *ALL 3 MANDATORY:*
${missing.map((m) => `   ❌ ${m}`).join("\n")}

${buildProgressMessage(session)}`;

    await sendAutoReply(chatId, errorMsg);
    return;
  }

  console.log(`\n👤 User lookup...`);
  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({
      name: `WhatsApp User ${phone}`,
      phone,
      email: `whatsapp_${phone}@sos.local`,
      role: "citizen",
    });
    await user.save();
  }
  console.log(`   ✅ User: ${user._id}`);

  const lat = incidentData.location.coordinates[1];
  const lon = incidentData.location.coordinates[0];

  console.log(`\n` + "=".repeat(60));
  console.log("PHASE 1: TEXT INTELLIGENCE");
  console.log("=".repeat(60));

  let textIntelligence = {
    translatedText: incidentData.description,
    detectedType: incidentData.type,
  };

  try {
    textIntelligence = await processTextIntelligence(
      incidentData.description
    );
    console.log(`   ✅ Type: ${textIntelligence.detectedType}`);
  } catch (err) {
    console.log(`   ⚠️ Skipped: ${err.message}`);
  }

  let forensics = incidentData.forensics || {
    realismFactor: 1.0,
    isFake: false,
    confidenceScore: 0,
    isPocket: false,
    verdict: "WhatsApp submission",
    deepfakeIndicators: [],
  };

  console.log(`\n` + "=".repeat(60));
  console.log("PHASE 2: FORENSICS");
  console.log("=".repeat(60));
  console.log(`   ✅ Verdict: ${forensics.verdict}`);
  console.log(`   ✅ Realism: ${(forensics.realismFactor * 100).toFixed(1)}%`);

  console.log(`\n` + "=".repeat(60));
  console.log("PHASE 3: AI VISION ANALYSIS");
  console.log("=".repeat(60));

  let visionAnalysis = incidentData.aiAnalysis.vision || {
    detected: [],
    confidence: 0,
    model: "WhatsApp",
  };

  console.log(`   ✅ Confidence: ${visionAnalysis.confidence}%`);
  console.log(
    `   ✅ Objects: ${visionAnalysis.detected.join(", ") || "None"}`
  );

  console.log(`\n` + "=".repeat(60));
  console.log("PHASE 4: SEMANTIC ALIGNMENT");
  console.log("=".repeat(60));

  let semantics = incidentData.aiAnalysis.semantics || {
    alignment: 50,
    description: "",
    model: "",
  };

  try {
    if (visionAnalysis.detected && visionAnalysis.detected.length > 0) {
      semantics = await analyzeSemantics(visionAnalysis, {});
      console.log(`   ✅ Alignment: ${semantics.alignment}%`);
    }
  } catch (err) {
    console.log(`   ⚠️ Semantic analysis error: ${err.message}`);
  }

  console.log(`\n` + "=".repeat(60));
  console.log("PHASE 5: TRUST SCORING");
  console.log("=".repeat(60));

  let trustScoreData = {
    totalScore: 55,
    formula: "WHATSAPP_ALL_MEDIA",
    breakdown: {
      visual: 0,
      audio: 0,
      alignment: 0,
      consensus: 0,
    },
    locationConsensus: { score: 0, nearbyIncidents: 0 },
  };

  try {
    trustScoreData = await calculateTrustScore(
      "IMAGE_TEXT",
      forensics,
      visionAnalysis,
      {},
      semantics,
      lat,
      lon
    );
    console.log(
      `   ✅ Score: ${trustScoreData.totalScore.toFixed(1)}/100`
    );
    console.log(`   ✅ Formula: ${trustScoreData.formula}`);
  } catch (err) {
    console.log(`   ⚠️ Trust scoring error: ${err.message}`);
  }

  console.log(`\n` + "=".repeat(60));
  console.log("PHASE 6: PRIORITY CODING");
  console.log("=".repeat(60));

  let priorityCode = {
    code: "ALPHA",
    description: "Standard incident",
    dispatchLevel: 2,
    autoDispatch: false,
  };

  try {
    priorityCode = await determinePriorityCode(
      trustScoreData,
      forensics,
      {},
      visionAnalysis,
      trustScoreData.locationConsensus,
      lat,
      lon
    );
    console.log(`   ✅ Code: ${priorityCode.code}`);
    console.log(`   ✅ Level: ${priorityCode.dispatchLevel}`);
  } catch (err) {
    console.log(`   ⚠️ Priority coding error: ${err.message}`);
  }

  console.log(`\n` + "=".repeat(60));
  console.log("DETERMINING SEVERITY");
  console.log("=".repeat(60));

  const desc = incidentData.description.toLowerCase();
  let severity = "Low";

  const criticalWords = ["dying", "dead", "trapped", "collapse", "explosion"];
  const highWords = [
    "fire",
    "blood",
    "injury",
    "crash",
    "burning",
    "flood",
  ];
  const mediumWords = ["help", "emergency", "hurt", "broken"];

  if (criticalWords.some((w) => desc.includes(w))) severity = "Critical";
  else if (highWords.some((w) => desc.includes(w))) severity = "High";
  else if (mediumWords.some((w) => desc.includes(w))) severity = "Medium";

  console.log(`   🔴 Final Severity: ${severity}`);
  console.log(`   📊 Trust Score: ${trustScoreData.totalScore.toFixed(1)}`);
  console.log(`   🏷️ Priority: ${priorityCode.code}`);

  console.log(`\n` + "=".repeat(60));
  console.log("CREATING INCIDENT IN DATABASE");
  console.log("=".repeat(60));

  // ✅ STORE WHATSAPP CHATID, PHONE, AND BASE64 IN INCIDENT
  const incident = new Incident({
    type: textIntelligence.detectedType || incidentData.type || "Other",
    description: incidentData.description,
    severity,
    mode: "IMAGE_TEXT",
    transcript: incidentData.transcript || undefined,
    language: "en",
    imageUrl: incidentData.imageUrl || null,
    imageBase64: incidentData.imageBase64 || null, // ✅ STORE BASE64
    location: {
      type: "Point",
      coordinates: [lon, lat],
    },
    reportedBy: user._id,
    status: forensics.isFake ? "Spam" : "Pending",
    forensics,
    aiAnalysis: {
      vision: visionAnalysis,
      voice: {
        keywords: [],
        sentiment: "neutral",
        confidence: 0,
        model: "WhatsApp",
      },
      semantics,
    },
    trustScore: trustScoreData,
    priorityCode,
    // ✅ STORE WHATSAPP INFO
    whatsappChatId: chatId,
    whatsappPhone: phone,
    verificationLog: [
      {
        phase: "whatsapp_sos_submission",
        timestamp: new Date(),
        result: {
          phone,
          chatId,
          mediaUploaded: incidentData.mediaUploaded,
          trustScore: trustScoreData.totalScore,
          severity,
          hasLocation: true,
          hasText: true,
          hasImage: true,
          base64Length: incidentData.imageBase64
            ? incidentData.imageBase64.length
            : 0,
        },
      },
    ],
  });

  await incident.save();
  await incident.populate("reportedBy", "name email phone role");

  console.log(`   ✅ Incident: ${incident._id}`);
  console.log(`   ✅ WhatsApp ChatId: ${chatId}`);
  console.log(`   ✅ Base64 Image: ${incidentData.imageBase64 ? incidentData.imageBase64.length + " chars" : "Not stored"}`);
  console.log(`   📏 Score: ${trustScoreData.totalScore.toFixed(1)}`);

  const refId = incident._id.toString().slice(-6).toUpperCase();

  const confirmMsg = `✅ *SOS REPORT SUBMITTED!*

🆔 *Reference:* #${refId}

📋 *Report Summary:*
   📍 Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}
   💬 Description: ${incidentData.description.substring(0, 60)}...
   🏷️ Type: *${incident.type}*
   🚨 Severity: *${severity}*
   🔴 Priority: *${priorityCode.code}*
   📊 Score: *${trustScoreData.totalScore.toFixed(1)}/100*
   📸 Media: Location ✅ Text ✅ Image ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 *Next Steps:*
   1️⃣ Agency reviews (2-5 min)
   2️⃣ Resources allocated
   3️⃣ Help dispatched
   4️⃣ Live updates here

🔔 *DO NOT CLOSE THIS CHAT*

${
  priorityCode.autoDispatch
    ? "⚡ *AUTO-DISPATCH* — Help is on the way!\n"
    : ""
}

Thank you! Stay safe! 🙏`;

  const confirmSent = await sendAutoReply(chatId, confirmMsg);
  if (confirmSent) {
    console.log(`   ✅ Confirmation sent`);
  } else {
    console.log(`   ⚠️ Confirmation send failed`);
  }

  await deleteSession(phone);
  console.log(`   🧹 Session cleared`);

  console.log("█".repeat(80) + "\n");
}

// ================================================================
//  API: Get SOS Status (for citizen tracking)
// ================================================================
export const getSOSStatus = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const incident = await Incident.findById(incidentId)
      .populate("reportedBy", "name email phone")
      .populate("respondedBy", "name email phone")
      .populate({
        path: "dispatchedResources",
        select: "item_name category quantity status location",
      });

    if (!incident) return res.status(404).json({ error: "Not found" });

    return res.status(200).json({
      success: true,
      incident: {
        id: incident._id,
        referenceNumber: incident._id
          .toString()
          .slice(-6)
          .toUpperCase(),
        status: incident.status,
        severity: incident.severity,
        type: incident.type,
        description: incident.description,
        imageUrl: incident.imageUrl,
        location: {
          latitude: incident.location.coordinates[1],
          longitude: incident.location.coordinates[0],
        },
        reportedAt: incident.createdAt,
        reportedBy: incident.reportedBy,
        respondedBy: incident.respondedBy || null,
        acceptedAt: incident.acceptedAt || null,
        dispatchedAt: incident.dispatchedAt || null,
        dispatchedResources: incident.dispatchedResources || [],
        trustScore: incident.trustScore?.totalScore,
        priority: incident.priorityCode?.code,
      },
      timeline: [
        { event: "SOS Created", timestamp: incident.createdAt, done: true },
        {
          event: "Agency Accepted",
          timestamp: incident.acceptedAt,
          done: incident.acceptedAt !== null,
        },
        {
          event: "Resources Dispatched",
          timestamp: incident.dispatchedAt,
          done: incident.dispatchedAt !== null,
        },
      ],
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ================================================================
//  API: Agency Accept Incident + SEND WHATSAPP UPDATE ✅
// ================================================================
export const agencyAcceptIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { agencyId, agencyName } = req.body;

    console.log(`\n` + "█".repeat(80));
    console.log(`█ 🏢 AGENCY ACCEPTING SOS + WHATSAPP NOTIFICATION`);
    console.log(`█`.repeat(80));

    const incident = await Incident.findById(incidentId).populate(
      "reportedBy",
      "name email phone"
    );

    if (!incident)
      return res.status(404).json({ error: "Incident not found" });

    if (incident.status !== "Pending") {
      return res.status(400).json({
        error: `Cannot accept: status is ${incident.status}`,
      });
    }

    // ✅ UPDATE INCIDENT STATUS
    incident.status = "Active";
    incident.respondedBy = agencyId;
    incident.acceptedAt = new Date();
    incident.verificationLog.push({
      phase: "agency_acceptance",
      timestamp: new Date(),
      result: { agencyId, agencyName, status: "Active" },
    });
    await incident.save();

    console.log(`   ✅ Accepted by: ${agencyName} (${agencyId})`);
    console.log(`   🆔 Incident: ${incidentId}`);
    console.log(`   🏷️ Type: ${incident.type}`);
    console.log(`   🚨 Severity: ${incident.severity}`);

    // ==================== SEND WHATSAPP UPDATE TO CITIZEN ✅ ====================
    console.log(`\n   📤 SENDING WHATSAPP TO CITIZEN...`);

    let sendSuccess = false;

    try {
      // ✅ GET WHATSAPP CHATID FROM INCIDENT
      const chatId = incident.whatsappChatId;

      if (!chatId) {
        throw new Error("No WhatsApp ChatId stored in incident");
      }

      const refId = incident._id.toString().slice(-6).toUpperCase();
      const lat = incident.location.coordinates[1];
      const lon = incident.location.coordinates[0];

      const acceptMsg = `✅ *SOS VERIFIED & ACCEPTED*

🏢 *Agency:* ${agencyName}
📋 *Reference:* #${refId}

🏷️ *Incident Type:* ${incident.type}
🚨 *Severity:* ${incident.severity}
💬 *Description:* ${incident.description.substring(0, 60)}...

📍 *Your Location:*
${lat.toFixed(4)}, ${lon.toFixed(4)}

🗺️ *View Map:* https://maps.google.com/?q=${lat},${lon}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚑 *Resources being prepared...*
   ⏳ Estimated dispatch: 5-10 minutes
   📱 You'll be notified when help leaves the station

🆘 *Stay calm & stay safe!*

🔔 *KEEP THIS CHAT OPEN FOR UPDATES*`;

      console.log(`   → ChatId: ${chatId}`);
      console.log(`   → Message size: ${acceptMsg.length} chars`);

      // ✅ CALL WHAPI AND CHECK RETURN VALUE
      sendSuccess = await sendAutoReply(chatId, acceptMsg);

      if (sendSuccess) {
        console.log(
          `   ✅ ✅ ✅ WHATSAPP SENT SUCCESSFULLY! ✅ ✅ ✅`
        );
      } else {
        console.log(`   ❌ ❌ ❌ WHATSAPP SEND FAILED! ❌ ❌ ❌`);
      }
    } catch (err) {
      console.log(`   ❌ ERROR: ${err.message}`);
      sendSuccess = false;
    }

    console.log("█".repeat(80) + "\n");

    return res.status(200).json({
      success: true,
      message: `SOS accepted${
        sendSuccess
          ? " ✅ Citizen notified via WhatsApp"
          : " ⚠️ WhatsApp notification failed"
      }`,
      whatsappSent: sendSuccess,
      incident: {
        id: incident._id,
        status: incident.status,
        acceptedAt: incident.acceptedAt,
        respondedBy: incident.respondedBy,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ================================================================
//  API: Coordinator Dispatch Resources + SEND WHATSAPP UPDATES ✅
// ================================================================
export const coordinatorDispatchResources = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { resourceIds, coordinatorId, coordinatorName } = req.body;

    console.log(`\n` + "█".repeat(80));
    console.log(`█ 🚑 DISPATCHING RESOURCES + WHATSAPP NOTIFICATIONS`);
    console.log(`█`.repeat(80));

    const incident = await Incident.findById(incidentId).populate(
      "reportedBy",
      "name email phone"
    );

    if (!incident)
      return res.status(404).json({ error: "Incident not found" });

    if (incident.status !== "Active") {
      return res.status(400).json({
        error: `Cannot dispatch: status is ${incident.status}. Must be Active.`,
      });
    }

    // ✅ GET RESOURCES FROM DATABASE
    console.log(`   🔍 Fetching ${resourceIds.length} resources...`);
    const resources = await Resource.find({ _id: { $in: resourceIds } });

    if (resources.length === 0) {
      return res.status(400).json({
        error: `No resources found for IDs: ${resourceIds.join(", ")}`,
      });
    }

    console.log(`   ✅ Found ${resources.length} resources`);

    // ✅ UPDATE INCIDENT
    incident.status = "Resolved";
    incident.dispatchedResources = resourceIds;
    incident.dispatchedAt = new Date();
    incident.verificationLog.push({
      phase: "resource_dispatch",
      timestamp: new Date(),
      result: {
        coordinatorId,
        coordinatorName,
        resourcesDispatched: resourceIds.length,
        resources: resources.map((r) => ({
          name: r.item_name,
          quantity: r.quantity,
          category: r.category,
          status: r.status,
        })),
      },
    });
    await incident.save();

    console.log(`   ✅ Incident status: Resolved`);

    // ✅ UPDATE RESOURCE STATUS TO DEPLOYED
    await Resource.updateMany(
      { _id: { $in: resourceIds } },
      {
        status: "Deployed",
        current_incident: incidentId,
      }
    );

    console.log(`   ✅ Resources updated to Deployed`);

    // ==================== SEND WHATSAPP UPDATES TO CITIZEN ✅ ====================
    console.log(`\n   📤 SENDING WHATSAPP MESSAGES TO CITIZEN...`);

    let messagesSent = 0;
    let errors = [];

    try {
      // ✅ GET WHATSAPP CHATID FROM INCIDENT
      const chatId = incident.whatsappChatId;

      if (!chatId) {
        throw new Error("No WhatsApp ChatId stored in incident");
      }

      const refId = incident._id.toString().slice(-6).toUpperCase();
      const lat = incident.location.coordinates[1];
      const lon = incident.location.coordinates[0];

      // Build resource list for main message
      const resourceList = resources
        .map(
          (r, i) =>
            `${i + 1}. 🚑 ${r.quantity}x *${r.item_name}*\n   Category: ${r.category}\n   Status: ${r.status}`
        )
        .join("\n\n");

      // ✅ MAIN DISPATCH MESSAGE
      const dispatchMsg = `🚀 *HELP IS ON THE WAY!* 🚀

✅ Emergency units DISPATCHED to your location.

📋 *Reference:* #${refId}
🏷️ *Type:* ${incident.type}
🚨 *Severity:* ${incident.severity}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 *DISPATCHED RESOURCES:*

${resourceList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 *Your Location:*
${lat.toFixed(4)}, ${lon.toFixed(4)}

🗺️ *View Map:* https://maps.google.com/?q=${lat},${lon}

⏱️ *ETA: 5-10 minutes*

🟢 *Status: UNDERWAY*

🔔 *LIVE UPDATES IN THIS CHAT*

🙏 *Stay calm. Help is coming!*`;

      console.log(
        `\n   📤 [1/MAIN] Sending main dispatch message...`
      );
      const mainResult = await sendAutoReply(chatId, dispatchMsg);

      if (mainResult) {
        console.log(`   ✅ Main message sent!`);
        messagesSent++;
      } else {
        console.log(`   ❌ Main message FAILED`);
        errors.push("Main dispatch message failed");
      }

      // ✅ SEND INDIVIDUAL RESOURCE UPDATES
      console.log(`\n   📤 Sending individual resource updates...`);

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];

        try {
          // Delay between messages
          if (i > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1500)
            );
          }

          const followUpMsg = `📍 *${resource.item_name.toUpperCase()}*

🆔 *Unit #${i + 1} arriving soon*

⏱️ ETA: 5-10 minutes
Quantity: ${resource.quantity}
Category: ${resource.category}

🟢 *Status: IN TRANSIT*

🗺️ Track location: https://maps.google.com/?q=${lat},${lon}

🔔 You'll be notified when unit arrives`;

          console.log(
            `   📤 [${i + 2}/${
              resources.length + 1
            }] ${resource.item_name}...`
          );
          const resResult = await sendAutoReply(
            chatId,
            followUpMsg
          );

          if (resResult) {
            console.log(
              `   ✅ Resource message sent: ${resource.item_name}`
            );
            messagesSent++;
          } else {
            console.log(
              `   ❌ Resource message FAILED: ${resource.item_name}`
            );
            errors.push(
              `Resource update failed: ${resource.item_name}`
            );
          }
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
          errors.push(
            `Exception for ${resource.item_name}: ${err.message}`
          );
        }
      }
    } catch (err) {
      console.log(`   ❌ WHATSAPP ERROR: ${err.message}`);
      errors.push(err.message);
    }

    console.log(
      `\n   📊 SUMMARY: ${messagesSent}/${resources.length + 1} messages sent`
    );
    console.log("█".repeat(80) + "\n");

    return res.status(200).json({
      success: true,
      message: `Resources dispatched - ${messagesSent}/${
        resources.length + 1
      } WhatsApp messages sent`,
      whatsappStatus: {
        messagesSent,
        totalExpected: resources.length + 1,
        errors: errors.length > 0 ? errors : null,
      },
      incident: {
        id: incident._id,
        status: incident.status,
        dispatchedAt: incident.dispatchedAt,
        resourcesCount: resources.length,
        location: {
          latitude: incident.location.coordinates[1],
          longitude: incident.location.coordinates[0],
        },
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ================================================================
//  API: Get Dispatched Resources for Incident (For Agency Display)
// ================================================================
export const getDispatchedResources = async (req, res) => {
  try {
    const { incidentId } = req.params;

    const incident = await Incident.findById(incidentId).populate({
      path: "dispatchedResources",
      select:
        "item_name category quantity status location baseLocation destinationLocation dispatchedAt owner",
      populate: {
        path: "owner",
        select: "name email phone role",
      },
    });

    if (!incident)
      return res.status(404).json({ error: "Incident not found" });

    return res.status(200).json({
      success: true,
      incident: {
        id: incident._id,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        dispatchedAt: incident.dispatchedAt,
        location: {
          latitude: incident.location.coordinates[1],
          longitude: incident.location.coordinates[0],
        },
      },
      resources: incident.dispatchedResources || [],
      metadata: {
        totalDispatched: incident.dispatchedResources?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ================================================================
//  API: Get Pending Incidents (for Agency Dashboard)
// ================================================================
export const getPendingIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ status: "Pending" })
      .populate("reportedBy", "name email phone role")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: incidents.length,
      incidents: incidents.map((inc) => ({
        id: inc._id,
        referenceNumber: inc._id
          .toString()
          .slice(-6)
          .toUpperCase(),
        type: inc.type,
        severity: inc.severity,
        description: inc.description,
        imageUrl: inc.imageUrl,
        location: {
          latitude: inc.location.coordinates[1],
          longitude: inc.location.coordinates[0],
        },
        reportedBy: inc.reportedBy,
        trustScore: inc.trustScore?.totalScore,
        priority: inc.priorityCode?.code,
        createdAt: inc.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ================================================================
//  API: Get Active Incidents (for Coordinator Dashboard)
// ================================================================
export const getActiveIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ status: "Active" })
      .populate("reportedBy", "name email phone")
      .populate("respondedBy", "name email")
      .populate({
        path: "dispatchedResources",
        select: "item_name category quantity status",
      })
      .sort({ acceptedAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ✅ DEFAULT EXPORT ONLY
export default {
  handleIncomingWhatsAppMessage,
  getSOSStatus,
  agencyAcceptIncident,
  coordinatorDispatchResources,
  getDispatchedResources,
  getPendingIncidents,
  getActiveIncidents,
};
