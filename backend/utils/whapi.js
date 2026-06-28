import axios from "axios";
import https from "https";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

if (!WHAPI_TOKEN) {
  console.error("❌ WHAPI_TOKEN not found in .env file!");
}

const whapiClient = axios.create({
  baseURL: "https://gate.whapi.cloud",
  headers: {
    Authorization: `Bearer ${WHAPI_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ✅ HELPER: Convert Node.js Buffer to Base64
export const nodeBufferToBase64 = (buffer) => {
  if (!buffer) return null;
  return buffer.toString("base64");
};

// ==================== DOWNLOAD FROM S3 / URL ✅ ====================
export const downloadImageAsBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    try {
      if (!imageUrl) {
        reject(new Error("Image URL required"));
        return;
      }

      console.log(`📥 Downloading image from URL: ${imageUrl.substring(0, 80)}...`);

      const protocol = imageUrl.startsWith("https") ? https : http;
      const chunks = [];

      protocol
        .get(imageUrl, (res) => {
          // Handle redirects
          if (res.statusCode === 301 || res.statusCode === 302) {
            const redirectUrl = res.headers.location;
            console.log(`   🔄 Redirect to: ${redirectUrl}`);
            downloadImageAsBase64(redirectUrl).then(resolve).catch(reject);
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          res.on("data", (chunk) => {
            chunks.push(chunk);
          });

          res.on("end", () => {
            try {
              const buffer = Buffer.concat(chunks);
              const base64String = buffer.toString("base64");

              console.log(`   ✅ Downloaded: ${buffer.length} bytes → ${base64String.length} chars`);

              resolve({
                base64: base64String,
                buffer: buffer,
                size: buffer.length,
                dataUrl: `data:image/jpeg;base64,${base64String}`,
              });
            } catch (err) {
              reject(err);
            }
          });
        })
        .on("error", (err) => {
          console.error(`   ❌ Download error: ${err.message}`);
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};

// ✅ HELPER: Download media and return as Base64 (from WHAPI media ID)
export const downloadMediaAsBase64 = async (mediaId) => {
  try {
    if (!mediaId) {
      throw new Error("Media ID required");
    }

    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`📥 Downloading media as base64: ${mediaId}`);

    const response = await whapiClient.get(`/media/${mediaId}`, {
      responseType: "arraybuffer",
    });

    // ✅ Convert arraybuffer to base64
    const base64String = nodeBufferToBase64(response.data);

    console.log(
      `✅ Downloaded & converted: ${response.data.length} bytes → ${base64String.length} chars`
    );

    return {
      base64: base64String,
      buffer: response.data,
      size: response.data.length,
      dataUrl: `data:image/jpeg;base64,${base64String}`,
    };
  } catch (error) {
    console.error(`❌ Download error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return null;
  }
};

/**
 * ==================== SEND MESSAGE ✅ RETURNS TRUE/FALSE ====================
 */
export const sendAutoReply = async (chatId, message) => {
  try {
    if (!chatId || !message) {
      console.error(
        `❌ Invalid params: chatId=${chatId}, message=${message ? "yes" : "no"}`
      );
      return false;
    }

    if (!WHAPI_TOKEN) {
      console.error("❌ WHAPI_TOKEN not configured");
      return false;
    }

    console.log(`📤 Sending to: ${chatId}`);
    console.log(`   Message length: ${message.length} chars`);

    const response = await whapiClient.post("/messages/text", {
      to: chatId,
      body: message,
    });

    // ✅ Check all possible ID locations
    const messageId =
      response.data?.id ||
      response.data?.result?.message_id ||
      response.data?.message?.id;

    if (response.data && messageId) {
      console.log(`✅ Message sent! ID: ${messageId}`);
      return true;
    } else {
      console.error(`❌ No ID in response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Send error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
};

/**
 * ==================== DOWNLOAD MEDIA ====================
 */
export const downloadMediaFromWhapi = async (mediaId) => {
  try {
    if (!mediaId) {
      throw new Error("Media ID required");
    }

    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`📥 Downloading media: ${mediaId}`);
    const response = await whapiClient.get(`/media/${mediaId}`, {
      responseType: "arraybuffer",
    });
    console.log(`✅ Downloaded: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    console.error(`❌ Download error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return null;
  }
};

/**
 * ==================== GET MESSAGE LIST ====================
 */
export const getMessageList = async (count = 100) => {
  try {
    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`\n📋 Fetching message list (last ${count} messages)...`);

    const response = await whapiClient.get(
      `/messages/list/?count=${count}`
    );

    console.log(
      `✅ Fetched ${response.data.data?.length || 0} messages`
    );

    if (response.data.data && response.data.data.length > 0) {
      console.log("\n" + "█".repeat(80));
      console.log("█ 📨 RECENT MESSAGES");
      console.log("█".repeat(80));

      response.data.data.forEach((msg, index) => {
        console.log(
          `\n${index + 1}. ${
            msg.timestamp
              ? new Date(msg.timestamp * 1000).toLocaleString()
              : "Unknown time"
          }`
        );
        console.log(`   From: ${msg.from_id || msg.from}`);
        console.log(`   Type: ${msg.type}`);
        console.log(`   Body: ${msg.text?.body || msg.body || "[Media]"}`);
        console.log(`   ID: ${msg.id}`);
      });

      console.log("\n" + "█".repeat(80) + "\n");
    }

    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Get message list error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return [];
  }
};

/**
 * ==================== GET CHATS LIST ====================
 */
export const getChatsList = async () => {
  try {
    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`\n💬 Fetching chats list...`);

    const response = await whapiClient.get(`/chats/list/`);

    console.log(`✅ Found ${response.data.data?.length || 0} chats`);

    if (response.data.data && response.data.data.length > 0) {
      console.log("\n" + "█".repeat(80));
      console.log("█ 💬 ACTIVE CHATS");
      console.log("█".repeat(80));

      response.data.data.forEach((chat, index) => {
        console.log(`\n${index + 1}. Chat ID: ${chat.id}`);
        console.log(`   Name: ${chat.name || "[No name]"}`);
        console.log(`   Type: ${chat.type}`);
        console.log(`   Unread: ${chat.unread_count || 0}`);
        console.log(
          `   Last Message: ${chat.last_message?.body || "[Media]"}`
        );
      });

      console.log("\n" + "█".repeat(80) + "\n");
    }

    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Get chats list error: ${error.message}`);
    return [];
  }
};

/**
 * ==================== GET SINGLE CHAT MESSAGES ====================
 */
export const getChatMessages = async (chatId, limit = 50) => {
  try {
    if (!chatId) {
      throw new Error("Chat ID required");
    }

    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(
      `\n📨 Fetching messages from chat: ${chatId} (limit: ${limit})`
    );

    const response = await whapiClient.get(
      `/chats/${chatId}/messages/?limit=${limit}`
    );

    console.log(
      `✅ Fetched ${response.data.data?.length || 0} messages`
    );

    if (response.data.data && response.data.data.length > 0) {
      console.log("\n" + "█".repeat(80));
      console.log(`█ 📨 CHAT MESSAGES - ${chatId}`);
      console.log("█".repeat(80));

      response.data.data.forEach((msg, index) => {
        console.log(
          `\n${index + 1}. ${
            msg.timestamp
              ? new Date(msg.timestamp * 1000).toLocaleString()
              : "Unknown"
          }`
        );
        console.log(`   From: ${msg.from_id}`);
        console.log(`   Type: ${msg.type}`);
        console.log(`   Body: ${msg.text?.body || "[Media/Other]"}`);
      });

      console.log("\n" + "█".repeat(80) + "\n");
    }

    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Get chat messages error: ${error.message}`);
    return [];
  }
};

/**
 * ==================== SEND IMAGE MESSAGE ====================
 */
export const sendImageMessage = async (
  chatId,
  imageUrl,
  caption = ""
) => {
  try {
    if (!chatId || !imageUrl) {
      throw new Error("ChatId and image URL required");
    }

    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`📤 Sending image to: ${chatId}`);

    const response = await whapiClient.post("/messages/image", {
      to: chatId,
      image: imageUrl,
      caption: caption || "",
    });

    console.log(`✅ Image sent! ID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Send image error: ${error.message}`);
    return null;
  }
};

/**
 * ==================== SEND LOCATION MESSAGE ====================
 */
export const sendLocationMessage = async (
  chatId,
  latitude,
  longitude,
  name = ""
) => {
  try {
    if (!chatId || !latitude || !longitude) {
      throw new Error("ChatId and coordinates required");
    }

    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`📤 Sending location to: ${chatId}`);

    const response = await whapiClient.post("/messages/location", {
      to: chatId,
      latitude,
      longitude,
      name: name || "Location",
    });

    console.log(`✅ Location sent! ID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Send location error: ${error.message}`);
    return null;
  }
};

/**
 * ==================== CHECK WEBHOOK STATUS ====================
 */
export const checkWebhookStatus = async () => {
  try {
    if (!WHAPI_TOKEN) {
      throw new Error("WHAPI_TOKEN not configured");
    }

    console.log(`\n🔍 Checking webhook status...`);

    const response = await whapiClient.get(`/settings/webhook`);

    console.log(`✅ Webhook Status:`);
    console.log(`   URL: ${response.data?.url}`);
    console.log(`   Status: ${response.data?.status}`);
    console.log(`   Last Update: ${response.data?.last_update}`);

    return response.data;
  } catch (error) {
    console.error(`❌ Webhook status error: ${error.message}`);
    return null;
  }
};

// ✅ ONLY DEFAULT EXPORT
export default {
  sendAutoReply,
  downloadMediaFromWhapi,
  downloadMediaAsBase64,
  downloadImageAsBase64,
  nodeBufferToBase64,
  getMessageList,
  getChatsList,
  getChatMessages,
  sendImageMessage,
  sendLocationMessage,
  checkWebhookStatus,
};