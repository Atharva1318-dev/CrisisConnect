import express from "express";
import { commanderChat, reportIncident } from "../controller/crisis.controller.js";

const router = express.Router();

router.post("/chat", commanderChat);       // The Chatbot Endpoint
router.post("/report", reportIncident);    // The Incident Reporting Endpoint

export default router;