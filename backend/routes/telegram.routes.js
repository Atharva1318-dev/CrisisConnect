import express from "express";
import { handleTelegramWebhook } from "../controller/telegram.controller.js";

const router = express.Router();

// Webhook endpoint
router.post("/webhook", handleTelegramWebhook);

export default router;
